// Traces to: L2-005, L2-056, L2-076, L2-003
// Task: T007
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace RecallQ.AcceptanceTests;

public class ContactsTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public ContactsTests(RecallqFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string GoodPassword = "correcthorse12";

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

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterAndLogin(RecallqFactory factory, string email)
    {
        var client = factory.CreateClient();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = ExtractAuthCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        Assert.Equal(HttpStatusCode.OK, me.StatusCode);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        Assert.True(body.TryGetProperty("id", out var idProp) && idProp.ValueKind != JsonValueKind.Null, $"Response: {body}");
        var userId = idProp.GetGuid();
        return (client, userId, cookie);
    }

    private static object SamplePayload(string displayName = "Alice Example") => new
    {
        displayName,
        initials = "AE",
        role = "Investor",
        organization = "ACME Capital",
        location = "NYC",
        tags = new[] { "vc", "portfolio" },
        emails = new[] { "alice@acme.com" },
        phones = new[] { "+15551234567" },
        avatarColorA = "#7c3aff",
        avatarColorB = "#c03aff",
    };

    private static async Task<HttpResponseMessage> PostContact(HttpClient client, string cookie, object payload)
    {
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(payload),
        };
        req.Headers.Add("Cookie", cookie);
        return await client.SendAsync(req);
    }

    [Fact]
    public async Task Create_contact_returns_201_and_persists_row()
    {
        var (client, _, cookie) = await RegisterAndLogin(_factory, UniqueEmail());
        var res = await PostContact(client, cookie, SamplePayload());
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        Assert.NotNull(res.Headers.Location);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Alice Example", body.GetProperty("displayName").GetString());
        Assert.Equal("AE", body.GetProperty("initials").GetString());
        Assert.Equal("Investor", body.GetProperty("role").GetString());

        var id = body.GetProperty("id").GetGuid();
        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{id}");
        getReq.Headers.Add("Cookie", cookie);
        var getRes = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.OK, getRes.StatusCode);
    }

    [Fact]
    public async Task Create_contact_missing_displayName_400()
    {
        var (client, _, cookie) = await RegisterAndLogin(_factory, UniqueEmail());
        var payload = new { initials = "AE", tags = Array.Empty<string>() };
        var res = await PostContact(client, cookie, payload);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadAsStringAsync();
        Assert.Contains("displayName", body);
    }

    [Fact]
    public async Task Create_contact_over_120_chars_400()
    {
        var (client, _, cookie) = await RegisterAndLogin(_factory, UniqueEmail());
        var payload = new { displayName = new string('x', 121), initials = "AE" };
        var res = await PostContact(client, cookie, payload);
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
        var body = await res.Content.ReadAsStringAsync();
        Assert.Contains("displayName", body);
    }

    [Fact]
    public async Task Create_contact_enqueues_embedding_job()
    {
        _factory.CapturedJobs.Clear();
        var (client, userId, cookie) = await RegisterAndLogin(_factory, UniqueEmail());
        var res = await PostContact(client, cookie, SamplePayload("Bob Embed"));
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetGuid();

        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (DateTime.UtcNow < deadline && !_factory.CapturedJobs.Any(j => j.Id == id))
            await Task.Delay(50);
        Assert.Contains(_factory.CapturedJobs, j => j.Id == id && j.OwnerUserId == userId);
    }

    [Fact]
    public async Task Create_without_auth_returns_401()
    {
        var client = _factory.CreateClient();
        var res = await client.PostAsJsonAsync("/api/contacts", SamplePayload());
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
    }

    [Fact]
    public async Task Owner_isolation_does_not_leak()
    {
        var (clientA, _, cookieA) = await RegisterAndLogin(_factory, UniqueEmail());
        var createRes = await PostContact(clientA, cookieA, SamplePayload("Owner A"));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var body = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetGuid();

        var (clientB, _, cookieB) = await RegisterAndLogin(_factory, UniqueEmail());
        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{id}");
        getReq.Headers.Add("Cookie", cookieB);
        var getRes = await clientB.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task Delete_contact_as_owner_returns_204()
    {
        var (client, _, cookie) = await RegisterAndLogin(_factory, UniqueEmail());
        var createRes = await PostContact(client, cookie, SamplePayload("Delete Me"));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var body = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetGuid();

        using var deleteReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/contacts/{id}");
        deleteReq.Headers.Add("Cookie", cookie);
        var deleteRes = await client.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NoContent, deleteRes.StatusCode);

        using var getReq = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{id}");
        getReq.Headers.Add("Cookie", cookie);
        var getRes = await client.SendAsync(getReq);
        Assert.Equal(HttpStatusCode.NotFound, getRes.StatusCode);
    }

    [Fact]
    public async Task Delete_contact_as_non_owner_returns_404()
    {
        var (clientA, _, cookieA) = await RegisterAndLogin(_factory, UniqueEmail());
        var createRes = await PostContact(clientA, cookieA, SamplePayload("Delete Me"));
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var body = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var id = body.GetProperty("id").GetGuid();

        var (clientB, _, cookieB) = await RegisterAndLogin(_factory, UniqueEmail());
        using var deleteReq = new HttpRequestMessage(HttpMethod.Delete, $"/api/contacts/{id}");
        deleteReq.Headers.Add("Cookie", cookieB);
        var deleteRes = await clientB.SendAsync(deleteReq);
        Assert.Equal(HttpStatusCode.NotFound, deleteRes.StatusCode);
    }
}
