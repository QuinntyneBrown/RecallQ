// Traces to: L2-010, L2-012, L2-013, L2-056, L2-078
// Task: T009
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;

namespace RecallQ.AcceptanceTests;

public class InteractionsTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public InteractionsTests(RecallqFactory factory) { _factory = factory; }

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

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterAndLogin(string email)
    {
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        var cookie = ExtractAuthCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private static async Task<HttpResponseMessage> Send(HttpClient client, HttpMethod method, string path, string cookie, object? body = null)
    {
        using var req = new HttpRequestMessage(method, path);
        if (body is not null) req.Content = JsonContent.Create(body);
        req.Headers.Add("Cookie", cookie);
        return await client.SendAsync(req);
    }

    private async Task<Guid> CreateContact(HttpClient client, string cookie, string name = "Alice")
    {
        var payload = new { displayName = name, initials = "AA" };
        var res = await Send(client, HttpMethod.Post, "/api/contacts", cookie, payload);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static object SampleInteraction(string type = "call", string content = "Great chat.") => new
    {
        type,
        occurredAt = DateTime.UtcNow,
        subject = "Intro",
        content,
    };

    [Fact]
    public async Task Log_interaction_persists_and_enqueues()
    {
        _factory.CapturedJobs.Clear();
        _factory.SummaryRefreshJobs.Clear();
        var (client, userId, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);

        var res = await Send(client, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookie, SampleInteraction());
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("call", body.GetProperty("type").GetString());
        Assert.Equal("Great chat.", body.GetProperty("content").GetString());
        var id = body.GetProperty("id").GetGuid();

        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (DateTime.UtcNow < deadline &&
            (!_factory.CapturedJobs.Any(j => j.Id == id && j.Kind == "interaction")
             || !_factory.SummaryRefreshJobs.Any(j => j.ContactId == contactId)))
            await Task.Delay(50);
        Assert.Contains(_factory.CapturedJobs, j => j.Id == id && j.Kind == "interaction" && j.OwnerUserId == userId);
        Assert.Contains(_factory.SummaryRefreshJobs, j => j.ContactId == contactId && j.OwnerUserId == userId);
    }

    [Fact]
    public async Task Invalid_type_returns_400()
    {
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);
        var res = await Send(client, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookie, SampleInteraction(type: "kayak"));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Content_over_8000_returns_400()
    {
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);
        var res = await Send(client, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookie,
            SampleInteraction(content: new string('x', 8001)));
        Assert.Equal(HttpStatusCode.BadRequest, res.StatusCode);
    }

    [Fact]
    public async Task Patch_interaction_re_enqueues_embedding()
    {
        _factory.CapturedJobs.Clear();
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);
        var createRes = await Send(client, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookie, SampleInteraction());
        var id = (await createRes.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var patchRes = await Send(client, HttpMethod.Patch, $"/api/interactions/{id}", cookie, new { content = "Updated." });
        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);

        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (DateTime.UtcNow < deadline && _factory.CapturedJobs.Count(j => j.Id == id) < 2)
            await Task.Delay(50);
        Assert.True(_factory.CapturedJobs.Count(j => j.Id == id && j.Kind == "interaction") >= 2);
    }

    [Fact]
    public async Task Delete_interaction_removes_embedding_row()
    {
        _factory.SummaryRefreshJobs.Clear();
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(client, cookie);
        var createRes = await Send(client, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookie, SampleInteraction());
        var id = (await createRes.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var delRes = await Send(client, HttpMethod.Delete, $"/api/interactions/{id}", cookie);
        Assert.Equal(HttpStatusCode.NoContent, delRes.StatusCode);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var exists = await db.Interactions.IgnoreQueryFilters().AnyAsync(i => i.Id == id);
        Assert.False(exists);

        var deadline = DateTime.UtcNow.AddSeconds(5);
        while (DateTime.UtcNow < deadline && !_factory.SummaryRefreshJobs.Any(j => j.ContactId == contactId))
            await Task.Delay(50);
        Assert.Contains(_factory.SummaryRefreshJobs, j => j.ContactId == contactId);
    }

    [Fact]
    public async Task Non_owner_cannot_patch_or_delete_404()
    {
        var (clientA, _, cookieA) = await RegisterAndLogin(UniqueEmail());
        var contactId = await CreateContact(clientA, cookieA);
        var createRes = await Send(clientA, HttpMethod.Post, $"/api/contacts/{contactId}/interactions", cookieA, SampleInteraction());
        var id = (await createRes.Content.ReadFromJsonAsync<JsonElement>()).GetProperty("id").GetGuid();

        var (clientB, _, cookieB) = await RegisterAndLogin(UniqueEmail());
        var patchRes = await Send(clientB, HttpMethod.Patch, $"/api/interactions/{id}", cookieB, new { content = "nope" });
        Assert.Equal(HttpStatusCode.NotFound, patchRes.StatusCode);
        var delRes = await Send(clientB, HttpMethod.Delete, $"/api/interactions/{id}", cookieB);
        Assert.Equal(HttpStatusCode.NotFound, delRes.StatusCode);
    }
}
