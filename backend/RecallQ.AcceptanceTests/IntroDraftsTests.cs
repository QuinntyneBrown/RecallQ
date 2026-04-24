// Traces to: L2-039, L2-055
// Task: T023
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class IntroDraftsTests : IClassFixture<AskFactory>
{
    private readonly AskFactory _factory;
    public IntroDraftsTests(AskFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"intro{Guid.NewGuid():N}@example.com";

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

    private static async Task<Guid> CreateContact(HttpClient client, string cookie, string displayName)
    {
        var payload = new
        {
            displayName,
            initials = "ZZ",
            role = (string?)null,
            organization = (string?)null,
            location = (string?)null,
            tags = Array.Empty<string>(),
            emails = Array.Empty<string>(),
            phones = Array.Empty<string>(),
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static HttpRequestMessage IntroReq(string cookie, Guid a, Guid b)
    {
        var req = new HttpRequestMessage(HttpMethod.Post, "/api/intro-drafts")
        {
            Content = JsonContent.Create(new { contactAId = a, contactBId = b })
        };
        req.Headers.Add("Cookie", cookie);
        return req;
    }

    [Fact]
    public async Task Generate_intro_returns_subject_and_body()
    {
        _factory.ChatClient.CompletionResponse = "{\"subject\":\"Hi Alice & Bob\",\"body\":\"You should meet because of many reasons.\"}";
        var (client, cookie) = await RegisterLogin();
        var a = await CreateContact(client, cookie, "Alice Alpha");
        var b = await CreateContact(client, cookie, "Bob Bravo");
        using var req = IntroReq(cookie, a, b);
        using var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Hi Alice & Bob", body.GetProperty("subject").GetString());
        Assert.Contains("meet", body.GetProperty("body").GetString()!);
    }

    [Fact]
    public async Task Invalid_contactB_returns_404()
    {
        var (client, cookie) = await RegisterLogin();
        var a = await CreateContact(client, cookie, "Alice Alpha");
        using var req = IntroReq(cookie, a, Guid.NewGuid());
        using var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.NotFound, res.StatusCode);
    }

    [Fact]
    public async Task Intro_rate_limited_at_21_per_minute()
    {
        _factory.ChatClient.CompletionResponse = "{\"subject\":\"S\",\"body\":\"B\"}";
        var (client, cookie) = await RegisterLogin();
        var a = await CreateContact(client, cookie, "Alice Alpha");
        var b = await CreateContact(client, cookie, "Bob Bravo");
        HttpStatusCode? seen429 = null;
        for (int i = 0; i < 25; i++)
        {
            using var req = IntroReq(cookie, a, b);
            using var res = await client.SendAsync(req);
            if (res.StatusCode == HttpStatusCode.TooManyRequests) { seen429 = res.StatusCode; break; }
        }
        Assert.Equal(HttpStatusCode.TooManyRequests, seen429);
    }
}
