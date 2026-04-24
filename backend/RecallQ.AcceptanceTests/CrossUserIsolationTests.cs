// Traces to: L2-053, L2-054, L2-056, L2-058
// Task: T029
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class CrossUserIsolationTests : IClassFixture<EmbeddingWorkerFactory>
{
    private readonly EmbeddingWorkerFactory _factory;
    public CrossUserIsolationTests(EmbeddingWorkerFactory factory) { _factory = factory; }

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
        using var me = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        me.Headers.Add("Cookie", cookie);
        var meRes = await client.SendAsync(me);
        var body = await meRes.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private static async Task<Guid> CreateContact(HttpClient client, string cookie, string name, string[]? tags = null)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(new {
                displayName = name, initials = "XX", role = (string?)null, organization = (string?)null,
                location = (string?)null, tags = tags ?? Array.Empty<string>(), emails = Array.Empty<string>(), phones = Array.Empty<string>()
            })
        };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task<Guid> CreateInteraction(HttpClient client, string cookie, Guid contactId, string content)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{contactId}/interactions")
        {
            Content = JsonContent.Create(new { type = "Note", occurredAt = DateTime.UtcNow, subject = "s", content })
        };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task Cross_user_get_contact_returns_404()
    {
        var (aClient, _, aCookie) = await RegisterLogin();
        var (bClient, _, bCookie) = await RegisterLogin();
        var id = await CreateContact(aClient, aCookie, "A's contact");

        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{id}");
        req.Headers.Add("Cookie", bCookie);
        var res = await bClient.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Cross_user_get_interaction_returns_404()
    {
        var (aClient, _, aCookie) = await RegisterLogin();
        var (bClient, _, bCookie) = await RegisterLogin();
        var cid = await CreateContact(aClient, aCookie, "A's contact");
        var iid = await CreateInteraction(aClient, aCookie, cid, "hello");

        using var req = new HttpRequestMessage(HttpMethod.Patch, $"/api/interactions/{iid}")
        {
            Content = JsonContent.Create(new { content = "hijack" })
        };
        req.Headers.Add("Cookie", bCookie);
        var res = await bClient.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Cross_user_search_only_returns_caller_contacts()
    {
        await using var bf = new EmbeddingWorkerFactory { EmbeddingClientFactory = _ => new BagOfWordsEmbeddingClient() };
        await ((IAsyncLifetime)bf).InitializeAsync();
        try
        {
            // User A creates 3 contacts, B creates 2. B searches.
            var emailA = UniqueEmail();
            var aClient = bf.CreateClient();
            Assert.Equal(HttpStatusCode.Created, (await aClient.PostAsJsonAsync("/api/auth/register", new { email = emailA, password = Pw })).StatusCode);
            var loginA = await aClient.PostAsJsonAsync("/api/auth/login", new { email = emailA, password = Pw });
            var aCookie = ExtractCookie(loginA);
            using var meA = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me"); meA.Headers.Add("Cookie", aCookie);
            var aId = (await (await aClient.SendAsync(meA)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

            var emailB = UniqueEmail();
            var bClient = bf.CreateClient();
            Assert.Equal(HttpStatusCode.Created, (await bClient.PostAsJsonAsync("/api/auth/register", new { email = emailB, password = Pw })).StatusCode);
            var loginB = await bClient.PostAsJsonAsync("/api/auth/login", new { email = emailB, password = Pw });
            var bCookie = ExtractCookie(loginB);
            using var meB = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me"); meB.Headers.Add("Cookie", bCookie);
            var bId = (await (await bClient.SendAsync(meB)).Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

            var aIds = new List<Guid>();
            for (int i = 0; i < 3; i++)
            {
                var id = await CreateContact(aClient, aCookie, $"Alpha widget A{i}");
                await CreateInteraction(aClient, aCookie, id, "widget alpha");
                aIds.Add(id);
            }
            var bIds = new List<Guid>();
            for (int i = 0; i < 2; i++)
            {
                var id = await CreateContact(bClient, bCookie, $"Alpha widget B{i}");
                await CreateInteraction(bClient, bCookie, id, "widget alpha");
                bIds.Add(id);
            }

            // Wait for embeddings to be generated for B
            var deadline = DateTime.UtcNow.AddSeconds(30);
            while (DateTime.UtcNow < deadline)
            {
                using var scope = bf.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var aCe = await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == aId && !e.Failed);
                var bCe = await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == bId && !e.Failed);
                if (aCe >= 3 && bCe >= 2) break;
                await Task.Delay(100);
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/search")
            {
                Content = JsonContent.Create(new { q = "widget" })
            };
            req.Headers.Add("Cookie", bCookie);
            var res = await bClient.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var body = await res.Content.ReadFromJsonAsync<JsonElement>();
            var results = body.GetProperty("results");
            var returnedIds = results.EnumerateArray().Select(r => r.GetProperty("contactId").GetGuid()).ToHashSet();
            foreach (var id in aIds) Assert.DoesNotContain(id, returnedIds);
            foreach (var id in bIds) Assert.Contains(id, returnedIds);
        }
        finally { await ((IAsyncLifetime)bf).DisposeAsync(); }
    }

    [Fact]
    public async Task Cross_user_summary_returns_404()
    {
        var (aClient, _, aCookie) = await RegisterLogin();
        var (bClient, _, bCookie) = await RegisterLogin();
        var cid = await CreateContact(aClient, aCookie, "A's contact");
        await CreateInteraction(aClient, aCookie, cid, "x");

        using var req = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{cid}/summary");
        req.Headers.Add("Cookie", bCookie);
        var res = await bClient.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Cross_user_suggestion_dismiss_returns_404()
    {
        var (aClient, aUserId, aCookie) = await RegisterLogin();
        var (bClient, _, bCookie) = await RegisterLogin();

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Suggestions.Add(new Suggestion
            {
                OwnerUserId = aUserId, Key = "cross-user-key", Kind = "meet_n_tag",
                Title = "t", Body = "b", ActionLabel = "go", ActionHref = "/x",
            });
            await db.SaveChangesAsync();
        }

        using var dismiss = new HttpRequestMessage(HttpMethod.Post, "/api/suggestions/cross-user-key/dismiss");
        dismiss.Headers.Add("Cookie", bCookie);
        var res = await bClient.SendAsync(dismiss);
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Bearer_in_query_string_rejected_400()
    {
        var client = _factory.CreateClient();
        var r1 = await client.GetAsync("/api/ping?token=abc");
        Assert.Equal(HttpStatusCode.BadRequest, r1.StatusCode);
        var body1 = await r1.Content.ReadAsStringAsync();
        Assert.Contains("bearer_in_query_forbidden", body1);

        var r2 = await client.GetAsync("/api/ping?access_token=abc");
        Assert.Equal(HttpStatusCode.BadRequest, r2.StatusCode);
        var body2 = await r2.Content.ReadAsStringAsync();
        Assert.Contains("bearer_in_query_forbidden", body2);
    }

    [Fact]
    public async Task XSS_payload_persisted_raw_rendered_escaped()
    {
        var (client, _, cookie) = await RegisterLogin();
        const string payload = "<script>alert(1)</script>";
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(new {
                displayName = payload, initials = "XS",
                role = (string?)null, organization = (string?)null, location = (string?)null,
                tags = new[] { "<img src=x onerror=alert(2)>" },
                emails = Array.Empty<string>(), phones = Array.Empty<string>()
            })
        };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetGuid();
        Assert.Equal(payload, body.GetProperty("displayName").GetString());

        using var get = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{id}");
        get.Headers.Add("Cookie", cookie);
        var getRes = await client.SendAsync(get);
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var getBody = await getRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(payload, getBody.GetProperty("displayName").GetString());
    }
}
