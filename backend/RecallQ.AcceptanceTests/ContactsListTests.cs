// Traces to: L2-009, L2-081
// Task: T008
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace RecallQ.AcceptanceTests;

public class ContactsListTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public ContactsListTests(RecallqFactory factory) { _factory = factory; }

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

    private async Task<(HttpClient client, string cookie)> RegisterAndLogin(string email)
    {
        var client = _factory.CreateClient();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        return (client, ExtractAuthCookie(login));
    }

    private static async Task PostContact(HttpClient client, string cookie, string displayName)
    {
        var payload = new { displayName, initials = "XX" };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(payload),
        };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
    }

    private static async Task<JsonElement> GetJson(HttpClient client, string cookie, string url)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, url);
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        return await res.Content.ReadFromJsonAsync<JsonElement>();
    }

    [Fact]
    public async Task List_returns_paged_results_with_totalCount()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        await PostContact(client, cookie, "One");
        await PostContact(client, cookie, "Two");
        await PostContact(client, cookie, "Three");

        var body = await GetJson(client, cookie, "/api/contacts?page=1&pageSize=2");
        Assert.Equal(3, body.GetProperty("totalCount").GetInt32());
        Assert.Equal(2, body.GetProperty("items").GetArrayLength());
        Assert.Equal(1, body.GetProperty("page").GetInt32());
        Assert.Equal(2, body.GetProperty("pageSize").GetInt32());
    }

    [Fact]
    public async Task List_response_includes_nextPage_cursor()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        await PostContact(client, cookie, "One");
        await PostContact(client, cookie, "Two");
        await PostContact(client, cookie, "Three");

        var page1 = await GetJson(client, cookie, "/api/contacts?page=1&pageSize=2");
        Assert.Equal(2, page1.GetProperty("nextPage").GetInt32());

        var page2 = await GetJson(client, cookie, "/api/contacts?page=2&pageSize=2");
        Assert.Equal(JsonValueKind.Null, page2.GetProperty("nextPage").ValueKind);
    }

    [Fact]
    public async Task List_default_sort_is_recent_interaction()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        await PostContact(client, cookie, "Alice");
        await PostContact(client, cookie, "Bob");

        var sorted = await GetJson(client, cookie, "/api/contacts?sort=name_asc");
        var aliceId = sorted.GetProperty("items")[0].GetProperty("id").GetGuid();

        var farFuture = new DateTime(2099, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        var ix = new
        {
            type = "note",
            occurredAt = farFuture,
            subject = (string?)"future signal",
            content = "future signal"
        };
        using var ixReq = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{aliceId}/interactions") { Content = JsonContent.Create(ix) };
        ixReq.Headers.Add("Cookie", cookie);
        var ixRes = await client.SendAsync(ixReq);
        Assert.Equal(HttpStatusCode.Created, ixRes.StatusCode);

        var body = await GetJson(client, cookie, "/api/contacts");
        var items = body.GetProperty("items");
        Assert.True(items.GetArrayLength() >= 2);
        Assert.Equal(aliceId, items[0].GetProperty("id").GetGuid());
    }

    [Fact]
    public async Task List_sort_name_returns_alphabetical()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        await PostContact(client, cookie, "Charlie");
        await PostContact(client, cookie, "Alpha");
        await PostContact(client, cookie, "Bravo");

        var body = await GetJson(client, cookie, "/api/contacts?sort=name_asc");
        var items = body.GetProperty("items");
        Assert.Equal("Alpha", items[0].GetProperty("displayName").GetString());
        Assert.Equal("Bravo", items[1].GetProperty("displayName").GetString());
        Assert.Equal("Charlie", items[2].GetProperty("displayName").GetString());
    }

    [Fact]
    public async Task List_empty_returns_200_empty_items()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        var body = await GetJson(client, cookie, "/api/contacts");
        Assert.Equal(0, body.GetProperty("totalCount").GetInt32());
        Assert.Equal(0, body.GetProperty("items").GetArrayLength());
    }

    [Fact]
    public async Task Count_returns_contacts_and_interactions_totals()
    {
        var (client, cookie) = await RegisterAndLogin(UniqueEmail());
        await PostContact(client, cookie, "One");
        await PostContact(client, cookie, "Two");

        var body = await GetJson(client, cookie, "/api/contacts/count");
        Assert.Equal(2, body.GetProperty("contacts").GetInt32());
        Assert.Equal(0, body.GetProperty("interactions").GetInt32());
    }
}
