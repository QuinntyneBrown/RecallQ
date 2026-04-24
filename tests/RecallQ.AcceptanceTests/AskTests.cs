// Traces to: L2-021, L2-022, L2-023, L2-025, L2-055, L2-061, L2-071, L2-084
// Task: T016, T017
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class AskTests : IClassFixture<AskFactory>
{
    private readonly AskFactory _factory;
    public AskTests(AskFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"ask{Guid.NewGuid():N}@example.com";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private async Task<(HttpClient client, string cookie)> RegisterLogin()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        return (client, ExtractCookie(login));
    }

    private static HttpRequestMessage AskRequest(string cookie, string q)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/ask")
        {
            Content = JsonContent.Create(new { q })
        };
        req.Headers.Add("Cookie", cookie);
        return req;
    }

    private static async Task<(string full, List<string> tokens)> ReadSseBody(HttpResponseMessage res)
    {
        var tokens = new List<string>();
        using var stream = await res.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (line.StartsWith("data:", StringComparison.Ordinal))
            {
                var payload = line["data:".Length..].Trim();
                if (payload.Length == 0 || payload == "{}") continue;
                try
                {
                    using var doc = JsonDocument.Parse(payload);
                    if (doc.RootElement.TryGetProperty("token", out var t) && t.ValueKind == JsonValueKind.String)
                        tokens.Add(t.GetString()!);
                }
                catch (JsonException) { }
            }
        }
        return (string.Concat(tokens), tokens);
    }

    [Fact]
    public async Task Ask_streams_tokens()
    {
        var (client, cookie) = await RegisterLogin();
        using var req = AskRequest(cookie, "hi");
        using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.Equal("text/event-stream", res.Content.Headers.ContentType?.MediaType);
        var (full, tokens) = await ReadSseBody(res);
        Assert.Contains("Based on your network", full);
        Assert.True(tokens.Count >= 2);
    }

    [Fact]
    public async Task First_token_within_1500ms_p95()
    {
        var (client, cookie) = await RegisterLogin();
        var timings = new List<long>();
        for (int i = 0; i < 10; i++)
        {
            using var req = AskRequest(cookie, $"q{i}");
            var sw = Stopwatch.StartNew();
            using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            using var stream = await res.Content.ReadAsStreamAsync();
            using var reader = new StreamReader(stream);
            string? line;
            while ((line = await reader.ReadLineAsync()) != null)
            {
                if (line.StartsWith("data:", StringComparison.Ordinal) && line.Contains("token"))
                {
                    sw.Stop();
                    timings.Add(sw.ElapsedMilliseconds);
                    break;
                }
            }
            // drain remaining
            while (await reader.ReadLineAsync() != null) { }
        }
        timings.Sort();
        var p95 = timings[(int)Math.Ceiling(0.95 * timings.Count) - 1];
        Assert.True(p95 < 1500, $"p95={p95}ms timings=[{string.Join(",", timings)}]");
    }

    [Fact]
    public async Task Rate_limited_21st_per_minute()
    {
        var (client, cookie) = await RegisterLogin();
        HttpStatusCode? seen429 = null;
        for (int i = 0; i < 25; i++)
        {
            using var req = AskRequest(cookie, "ping");
            using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
            if (res.StatusCode == HttpStatusCode.TooManyRequests) { seen429 = res.StatusCode; break; }
            // drain
            using var s = await res.Content.ReadAsStreamAsync();
            using var rd = new StreamReader(s);
            while (await rd.ReadLineAsync() != null) { }
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, seen429);
    }

    private async Task<Guid> GetUserId(HttpClient client, string cookie)
    {
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task<Guid> CreateContact(HttpClient client, string cookie, string displayName)
    {
        var payload = new { displayName, initials = "ZZ", role = (string?)null, organization = (string?)null,
            location = (string?)null, tags = Array.Empty<string>(), emails = Array.Empty<string>(), phones = Array.Empty<string>() };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private async Task WaitForEmbeddings(Guid userId, int expected)
    {
        var deadline = DateTime.UtcNow.AddSeconds(30);
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cc = await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId && !e.Failed);
            if (cc >= expected) return;
            await Task.Delay(100);
        }
        throw new Xunit.Sdk.XunitException($"embeddings not ready for {userId}");
    }

    private static async Task<List<(string eventName, string data)>> ReadSseFrames(HttpResponseMessage res)
    {
        var frames = new List<(string, string)>();
        using var stream = await res.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        var currentEvent = "message";
        var dataBuf = new StringBuilder();
        string? line;
        while ((line = await reader.ReadLineAsync()) != null)
        {
            if (line.Length == 0)
            {
                if (dataBuf.Length > 0 || currentEvent != "message")
                    frames.Add((currentEvent, dataBuf.ToString()));
                currentEvent = "message";
                dataBuf.Clear();
                continue;
            }
            if (line.StartsWith("event:", StringComparison.Ordinal))
                currentEvent = line["event:".Length..].Trim();
            else if (line.StartsWith("data:", StringComparison.Ordinal))
                dataBuf.Append(line["data:".Length..].Trim());
        }
        if (dataBuf.Length > 0 || currentEvent != "message")
            frames.Add((currentEvent, dataBuf.ToString()));
        return frames;
    }

    [Fact]
    public async Task Ask_emits_citations_with_up_to_3()
    {
        var (client, cookie) = await RegisterLogin();
        var userId = await GetUserId(client, cookie);
        await CreateContact(client, cookie, "Alice VC Investor in AI");
        await CreateContact(client, cookie, "Bob DevOps Engineer");
        await CreateContact(client, cookie, "Carol Kindergarten Teacher");
        await WaitForEmbeddings(userId, 3);

        using var req = AskRequest(cookie, "hi");
        using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var frames = await ReadSseFrames(res);
        var citationsFrame = frames.FirstOrDefault(f => f.eventName == "citations");
        Assert.False(string.IsNullOrEmpty(citationsFrame.data), "expected citations frame");
        using var doc = JsonDocument.Parse(citationsFrame.data);
        var items = doc.RootElement.GetProperty("items");
        Assert.Equal(3, items.GetArrayLength());
        foreach (var item in items.EnumerateArray())
        {
            Assert.True(item.TryGetProperty("contactId", out _));
            Assert.True(item.TryGetProperty("contactName", out var n) && !string.IsNullOrEmpty(n.GetString()));
            Assert.True(item.TryGetProperty("snippet", out _));
            var sim = item.GetProperty("similarity").GetDouble();
            Assert.InRange(sim, 0.0, 1.0);
            var src = item.GetProperty("source").GetString();
            Assert.Contains(src, new[] { "contact", "interaction" });
        }
        Assert.Contains(frames, f => f.eventName == "done");
    }

    [Fact]
    public async Task Ask_with_no_hits_omits_citations()
    {
        var (client, cookie) = await RegisterLogin();
        using var req = AskRequest(cookie, "hi");
        using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var frames = await ReadSseFrames(res);
        Assert.DoesNotContain(frames, f => f.eventName == "citations");
        Assert.Contains(frames, f => f.eventName == "done");
    }

    [Fact]
    public async Task Question_not_in_logs()
    {
        _factory.LogMessages.Clear();
        var (client, cookie) = await RegisterLogin();
        var unique = "ZANZIBAR_ASK_QUESTION_42_X";
        using var req = AskRequest(cookie, unique);
        using var res = await client.SendAsync(req, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        _ = await ReadSseBody(res);
        Assert.DoesNotContain(_factory.LogMessages, m => m.Contains(unique));
        Assert.Contains(_factory.LogMessages, m => m.Contains("q_len=") && m.Contains("q_hash="));
    }
}
