// Traces to: L2-014, L2-015, L2-016, L2-019, L2-020, L2-055, L2-063, L2-071
// Task: T013
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class SearchTests : IClassFixture<EmbeddingWorkerFactory>
{
    private readonly EmbeddingWorkerFactory _factory;
    public SearchTests(EmbeddingWorkerFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string Pw = "correcthorse12";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterLogin()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
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

    private static async Task CreateInteraction(HttpClient client, string cookie, Guid contactId, string content, string? subject = null)
    {
        var payload = new { type = "note", occurredAt = DateTime.UtcNow, subject, content };
        using var req = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{contactId}/interactions") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
    }

    private async Task WaitForEmbeddings(Guid userId, int contactCount, int interactionCount)
    {
        var deadline = DateTime.UtcNow.AddSeconds(30);
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cc = await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId && !e.Failed);
            var ic = await db.InteractionEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId && !e.Failed);
            if (cc >= contactCount && ic >= interactionCount) return;
            await Task.Delay(100);
        }
        throw new Xunit.Sdk.XunitException($"embeddings not ready for {userId}");
    }

    private static async Task<JsonElement> PostSearch(HttpClient client, string cookie, object payload)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        return await res.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task Search_returns_ranked_results_with_scores()
    {
        await using var bf = new EmbeddingWorkerFactory { EmbeddingClientFactory = _ => new BagOfWordsEmbeddingClient() };
        await ((IAsyncLifetime)bf).InitializeAsync();
        try
        {
            var (client, userId, cookie) = await RegisterLoginOn(bf);
            var alice = await CreateContact(client, cookie, "Alice VC Investor in AI");
            await CreateContact(client, cookie, "Bob DevOps Engineer");
            await CreateContact(client, cookie, "Carol Kindergarten Teacher");
            await WaitForEmbeddingsOn(bf, userId, 3, 0);

            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search") { Content = JsonContent.Create(new { q = "Alice VC Investor in AI" }) };
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var body = await res.Content.ReadFromJsonAsync<JsonElement>();
            var results = body.GetProperty("results");
            Assert.True(results.GetArrayLength() >= 1);
            var top = results[0];
            Assert.Equal(alice, top.GetProperty("contactId").GetGuid());
            var sim = top.GetProperty("similarity").GetDouble();
            Assert.InRange(sim, 0.0, 1.0);
            var src = top.GetProperty("matchedSource").GetString();
            Assert.Contains(src, new[] { "contact", "interaction" });
        }
        finally { await ((IAsyncLifetime)bf).DisposeAsync(); }
    }

    [Fact]
    public async Task Search_collapses_to_best_per_contact()
    {
        var (client, userId, cookie) = await RegisterLogin();
        var c = await CreateContact(client, cookie, "Dave Alpha");
        await CreateInteraction(client, cookie, c, "alpha beta gamma");
        await CreateInteraction(client, cookie, c, "alpha topic two");
        await CreateInteraction(client, cookie, c, "alpha topic three");
        await WaitForEmbeddings(userId, 1, 3);

        var body = await PostSearch(client, cookie, new { q = "alpha beta gamma" });
        var results = body.GetProperty("results");
        var count = 0;
        for (int i = 0; i < results.GetArrayLength(); i++)
            if (results[i].GetProperty("contactId").GetGuid() == c) count++;
        Assert.Equal(1, count);
    }

    [Fact]
    public async Task Search_picks_interaction_over_contact_when_higher_similarity()
    {
        await using var bf = new EmbeddingWorkerFactory { EmbeddingClientFactory = _ => new BagOfWordsEmbeddingClient() };
        await ((IAsyncLifetime)bf).InitializeAsync();
        try
        {
            var (client, userId, cookie) = await RegisterLoginOn(bf);
            var alice = await CreateContact(client, cookie, "Alice");
            var query = "investors who liked AI tools";
            await CreateInteraction(client, cookie, alice, query);
            await WaitForEmbeddingsOn(bf, userId, 1, 1);

            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search") { Content = JsonContent.Create(new { q = query }) };
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var body = await res.Content.ReadFromJsonAsync<JsonElement>();
            var results = body.GetProperty("results");
            Assert.True(results.GetArrayLength() >= 1);
            var top = results.EnumerateArray().First(r => r.GetProperty("contactId").GetGuid() == alice);
            Assert.Equal("interaction", top.GetProperty("matchedSource").GetString());
        }
        finally { await ((IAsyncLifetime)bf).DisposeAsync(); }
    }

    private static async Task<(HttpClient client, Guid userId, string cookie)> RegisterLoginOn(EmbeddingWorkerFactory f)
    {
        var email = UniqueEmail();
        var client = f.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private static async Task WaitForEmbeddingsOn(EmbeddingWorkerFactory f, Guid userId, int cc, int ic)
    {
        var deadline = DateTime.UtcNow.AddSeconds(30);
        while (DateTime.UtcNow < deadline)
        {
            using var scope = f.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var a = await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId && !e.Failed);
            var b = await db.InteractionEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId && !e.Failed);
            if (a >= cc && b >= ic) return;
            await Task.Delay(100);
        }
        throw new Xunit.Sdk.XunitException("embeddings not ready");
    }

    [Fact]
    public async Task Search_empty_q_400()
    {
        var (client, _, cookie) = await RegisterLogin();
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search") { Content = JsonContent.Create(new { q = "   " }) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var text = await res.Content.ReadAsStringAsync();
        Assert.Contains("q", text);
    }

    [Fact]
    public async Task Search_no_data_returns_200_empty()
    {
        var (client, _, cookie) = await RegisterLogin();
        var body = await PostSearch(client, cookie, new { q = "anything" });
        Assert.Equal(0, body.GetProperty("results").GetArrayLength());
        Assert.Equal(JsonValueKind.Null, body.GetProperty("nextPage").ValueKind);
        Assert.Equal(0, body.GetProperty("contactsMatched").GetInt32());
    }

    [Fact]
    public async Task Search_matched_text_truncated_to_240_on_word_boundary()
    {
        await using var bf = new EmbeddingWorkerFactory { EmbeddingClientFactory = _ => new BagOfWordsEmbeddingClient() };
        await ((IAsyncLifetime)bf).InitializeAsync();
        try
        {
            var (client, userId, cookie) = await RegisterLoginOn(bf);
            var c = await CreateContact(client, cookie, "Zeta Target");
            var lorem = string.Join(" ", Enumerable.Repeat("Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation", 5));
            Assert.True(lorem.Length > 500);
            await CreateInteraction(client, cookie, c, lorem);
            await WaitForEmbeddingsOn(bf, userId, 1, 1);

            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search") { Content = JsonContent.Create(new { q = "Lorem ipsum dolor" }) };
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var body = await res.Content.ReadFromJsonAsync<JsonElement>();
            var results = body.GetProperty("results");
            Assert.True(results.GetArrayLength() >= 1);
            var top = results.EnumerateArray().First(r => r.GetProperty("contactId").GetGuid() == c);
            var mt = top.GetProperty("matchedText").GetString()!;
            Assert.True(mt.Length <= 240, $"length was {mt.Length}");
            Assert.EndsWith("…", mt);
            var withoutEllipsis = mt[..^1];
            Assert.True(lorem.Contains(withoutEllipsis), "truncated prefix should be substring of original");
            Assert.False(char.IsWhiteSpace(withoutEllipsis[^1]));
        }
        finally { await ((IAsyncLifetime)bf).DisposeAsync(); }
    }

    [Fact]
    public async Task Search_61st_per_minute_returns_429()
    {
        var (client, _, cookie) = await RegisterLogin();
        HttpStatusCode? seen429 = null;
        for (int i = 0; i < 65; i++)
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, "/api/search?q=ping");
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            if (res.StatusCode == HttpStatusCode.TooManyRequests) { seen429 = res.StatusCode; break; }
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, seen429);
    }

    [Fact]
    public async Task Search_query_absent_from_logs()
    {
        _factory.LogMessages.Clear();
        var (client, _, cookie) = await RegisterLogin();
        var unique = "ZANZIBAR_SEARCH_TERM_42_X";
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search") { Content = JsonContent.Create(new { q = unique }) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.DoesNotContain(_factory.LogMessages, m => m.Contains(unique));
        Assert.Contains(_factory.LogMessages, m => m.Contains("q_len=") && m.Contains("q_hash="));
    }
}
