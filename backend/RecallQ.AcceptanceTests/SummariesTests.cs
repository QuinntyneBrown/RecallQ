// Traces to: L2-031, L2-032, L2-033
// Task: T019
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api.Chat;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class SummariesTests : IClassFixture<SummaryWorkerFactory>
{
    private readonly SummaryWorkerFactory _factory;
    public SummariesTests(SummaryWorkerFactory factory) { _factory = factory; }

    private const string GoodPassword = "correcthorse12";
    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";

    private static string ExtractAuthCookie(HttpResponseMessage response)
    {
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        foreach (var c in cookies!)
        {
            if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
            {
                var semi = c.IndexOf(';');
                return semi > 0 ? c[..semi] : c;
            }
        }
        throw new Xunit.Sdk.XunitException("rq_auth cookie not found");
    }

    private static async Task<(HttpClient client, string cookie)> RegisterAndLogin(RecallqFactory factory)
    {
        var client = factory.CreateClient();
        var email = UniqueEmail();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return (client, ExtractAuthCookie(login));
    }

    private static async Task<Guid> CreateContact(HttpClient client, string cookie, string displayName = "Sam Summary")
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(new { displayName, initials = "SS", role = "Partner", organization = "Acme" }),
        };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task LogInteraction(HttpClient client, string cookie, Guid contactId, string content, DateTime occurredAt)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{contactId}/interactions")
        {
            Content = JsonContent.Create(new { type = "note", occurredAt, content }),
        };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
    }

    private static async Task<JsonElement> GetSummary(HttpClient client, string cookie, Guid contactId)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{contactId}/summary");
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        return await res.Content.ReadFromJsonAsync<JsonElement>();
    }

    private static async Task<JsonElement> PollSummaryUntil(HttpClient client, string cookie, Guid contactId, Func<JsonElement, bool> cond, int timeoutSeconds = 30)
    {
        var deadline = DateTime.UtcNow.AddSeconds(timeoutSeconds);
        JsonElement last = default;
        while (DateTime.UtcNow < deadline)
        {
            last = await GetSummary(client, cookie, contactId);
            if (cond(last)) return last;
            await Task.Delay(200);
        }
        throw new Xunit.Sdk.XunitException($"Timed out waiting for summary condition; last={last}");
    }

    [Fact]
    public async Task Summary_for_contact_with_interactions_returns_paragraph_and_stats()
    {
        var (client, cookie) = await RegisterAndLogin(_factory);
        var id = await CreateContact(client, cookie);
        var now = DateTime.UtcNow;
        await LogInteraction(client, cookie, id, "Chat about hiring", now.AddDays(-1));
        await LogInteraction(client, cookie, id, "Email reply", now.AddDays(-2));
        await LogInteraction(client, cookie, id, "Coffee notes", now.AddDays(-3));

        var body = await PollSummaryUntil(client, cookie, id, e =>
            e.GetProperty("status").GetString() == "ready"
            && e.GetProperty("interactionCount").GetInt32() == 3);
        Assert.Equal("ready", body.GetProperty("status").GetString());
        var paragraph = body.GetProperty("paragraph").GetString();
        Assert.False(string.IsNullOrWhiteSpace(paragraph));
        var sentiment = body.GetProperty("sentiment").GetString();
        Assert.Contains(sentiment, new[] { "Warm", "Neutral", "Cool" });
        Assert.Equal(3, body.GetProperty("interactionCount").GetInt32());
        Assert.NotEqual(JsonValueKind.Null, body.GetProperty("lastInteractionAt").ValueKind);
    }

    [Fact]
    public async Task Summary_for_contact_with_no_interactions_shows_not_enough_data()
    {
        var (client, cookie) = await RegisterAndLogin(_factory);
        var id = await CreateContact(client, cookie);

        using var refreshReq = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{id}/summary:refresh");
        refreshReq.Headers.Add("Cookie", cookie);
        var refreshRes = await client.SendAsync(refreshReq);
        Assert.Equal(HttpStatusCode.Accepted, refreshRes.StatusCode);

        var body = await PollSummaryUntil(client, cookie, id, e =>
        {
            var s = e.GetProperty("status").GetString();
            return s == "not_enough_data";
        });
        Assert.Equal("not_enough_data", body.GetProperty("status").GetString());
    }

    [Fact]
    public async Task Refresh_twice_in_60s_429()
    {
        var (client, cookie) = await RegisterAndLogin(_factory);
        var id = await CreateContact(client, cookie);
        await LogInteraction(client, cookie, id, "hello", DateTime.UtcNow.AddDays(-1));

        using var req1 = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{id}/summary:refresh");
        req1.Headers.Add("Cookie", cookie);
        var r1 = await client.SendAsync(req1);
        Assert.Equal(HttpStatusCode.Accepted, r1.StatusCode);

        using var req2 = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{id}/summary:refresh");
        req2.Headers.Add("Cookie", cookie);
        var r2 = await client.SendAsync(req2);
        Assert.Equal((HttpStatusCode)429, r2.StatusCode);
    }

    [Fact]
    public async Task Refresh_different_contacts_within_60s_each_get_their_own_bucket()
    {
        var (client, cookie) = await RegisterAndLogin(_factory);
        var idA = await CreateContact(client, cookie);
        var idB = await CreateContact(client, cookie);
        await LogInteraction(client, cookie, idA, "alpha", DateTime.UtcNow.AddDays(-1));
        await LogInteraction(client, cookie, idB, "beta", DateTime.UtcNow.AddDays(-1));

        using var reqA = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{idA}/summary:refresh");
        reqA.Headers.Add("Cookie", cookie);
        var rA = await client.SendAsync(reqA);
        Assert.Equal(HttpStatusCode.Accepted, rA.StatusCode);

        using var reqB = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{idB}/summary:refresh");
        reqB.Headers.Add("Cookie", cookie);
        var rB = await client.SendAsync(reqB);
        Assert.Equal(HttpStatusCode.Accepted, rB.StatusCode);
    }

    [Fact]
    public async Task Cached_summary_within_1h_does_not_call_LLM()
    {
        await using var factory = new CountingFactory();
        await factory.InitializeAsync();
        try
        {
            var (client, cookie) = await RegisterAndLogin(factory);
            var id = await CreateContact(client, cookie);
            await LogInteraction(client, cookie, id, "first", DateTime.UtcNow.AddDays(-1));

            await PollSummaryUntil(client, cookie, id, e => e.GetProperty("status").GetString() == "ready");
            var c1 = factory.Counting.Count;
            Assert.True(c1 >= 1);

            // Immediate re-GET should NOT trigger a new LLM call (no enqueue since row exists ready).
            var body = await GetSummary(client, cookie, id);
            Assert.Equal("ready", body.GetProperty("status").GetString());
            await Task.Delay(500);
            Assert.Equal(c1, factory.Counting.Count);
        }
        finally
        {
            await factory.DisposeAsync();
        }
    }

    [Fact]
    public async Task New_interaction_invalidates_summary_and_regenerates()
    {
        await using var factory = new CountingFactory();
        await factory.InitializeAsync();
        try
        {
            var (client, cookie) = await RegisterAndLogin(factory);
            var id = await CreateContact(client, cookie);
            await LogInteraction(client, cookie, id, "first", DateTime.UtcNow.AddDays(-2));

            var first = await PollSummaryUntil(client, cookie, id, e => e.GetProperty("status").GetString() == "ready");
            var t1 = first.GetProperty("updatedAt").GetDateTime();
            var c1 = factory.Counting.Count;

            await Task.Delay(10);
            await LogInteraction(client, cookie, id, "second new content", DateTime.UtcNow);

            var deadline = DateTime.UtcNow.AddSeconds(30);
            DateTime t2 = t1;
            while (DateTime.UtcNow < deadline)
            {
                var body = await GetSummary(client, cookie, id);
                if (body.GetProperty("status").GetString() == "ready")
                {
                    t2 = body.GetProperty("updatedAt").GetDateTime();
                    if (t2 > t1) break;
                }
                await Task.Delay(200);
            }
            Assert.True(t2 > t1, $"Expected updatedAt to advance; t1={t1:o} t2={t2:o}");
            Assert.True(factory.Counting.Count > c1);
        }
        finally
        {
            await factory.DisposeAsync();
        }
    }

    private class CountingFactory : SummaryWorkerFactory
    {
        public CountingChatClient Counting { get; private set; } = null!;
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            Counting = new CountingChatClient(FakeChat);
            ChatClientFactory = _ => Counting;
            base.ConfigureWebHost(builder);
        }
    }
}
