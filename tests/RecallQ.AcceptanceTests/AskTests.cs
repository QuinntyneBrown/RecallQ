// Traces to: L2-021, L2-022, L2-025, L2-055, L2-061, L2-071, L2-084
// Task: T016
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
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
