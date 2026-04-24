// Traces to: L2-006, L2-011, L2-083
// Task: T010
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace RecallQ.AcceptanceTests;

public class ContactsDetailTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public ContactsDetailTests(RecallqFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string GoodPassword = "correcthorse12";

    private static string ExtractAuthCookie(HttpResponseMessage r)
    {
        foreach (var c in r.Headers.GetValues("Set-Cookie"))
            if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
            {
                var s = c.IndexOf(';');
                return s > 0 ? c[..s] : c;
            }
        throw new Xunit.Sdk.XunitException("rq_auth cookie not found");
    }

    private async Task<(HttpClient client, string cookie)> RegisterAndLogin(string email)
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        return (client, ExtractAuthCookie(login));
    }

    private static async Task<HttpResponseMessage> Send(HttpClient client, HttpMethod method, string path, string cookie, object? body = null)
    {
        using var req = new HttpRequestMessage(method, path);
        if (body is not null) req.Content = JsonContent.Create(body);
        req.Headers.Add("Cookie", cookie);
        return await client.SendAsync(req);
    }

    private async Task<Guid> CreateContact(HttpClient client, string cookie, string name = "Sarah")
    {
        var res = await Send(client, HttpMethod.Post, "/api/contacts", cookie,
            new { displayName = name, initials = "SM" });
        var b = await res.Content.ReadFromJsonAsync<JsonElement>();
        return b.GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task Get_contact_returns_detail_with_recent_interactions()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);
        var now = DateTime.UtcNow;
        var offsets = new[] { 10, 1, 5, 3, 7 };
        foreach (var d in offsets)
        {
            var res = await Send(client, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookie,
                new { type = "note", occurredAt = now.AddDays(-d), subject = $"s{d}", content = $"c{d}" });
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        }

        var getRes = await Send(client, HttpMethod.Get, $"/api/contacts/{contactId}", cookie);
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
        var body = await getRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(5, body.GetProperty("interactionTotal").GetInt32());
        var recent = body.GetProperty("recentInteractions");
        Assert.Equal(3, recent.GetArrayLength());
        var times = recent.EnumerateArray().Select(e => e.GetProperty("occurredAt").GetDateTime()).ToArray();
        Assert.True(times[0] >= times[1] && times[1] >= times[2]);
        Assert.False(body.GetProperty("starred").GetBoolean());
    }

    [Fact]
    public async Task Get_contact_owned_by_another_user_returns_404()
    {
        var (clientA, cookieA) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(clientA, cookieA);
        var (clientB, cookieB) = await RegisterAndLogin(UniqueEmail());
        var getRes = await Send(clientB, HttpMethod.Get, $"/api/contacts/{contactId}", cookieB);
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task Patch_contact_starred_true_persists()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);
        var patchRes = await Send(client, HttpMethod.Patch, $"/api/contacts/{contactId}", cookie, new { starred = true });
        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);
        var body = await patchRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.GetProperty("starred").GetBoolean());

        var getRes = await Send(client, HttpMethod.Get, $"/api/contacts/{contactId}", cookie);
        var getBody = await getRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(getBody.GetProperty("starred").GetBoolean());
    }
}
