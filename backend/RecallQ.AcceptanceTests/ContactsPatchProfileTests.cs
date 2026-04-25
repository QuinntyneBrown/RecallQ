using System.Net;
using System.Net.Http.Json;
using System.Text.Json;

namespace RecallQ.AcceptanceTests;

public class ContactsPatchProfileTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public ContactsPatchProfileTests(RecallqFactory factory) { _factory = factory; }

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

    private async Task<(HttpClient, string)> RegisterAndLogin(RecallqFactory factory)
    {
        var email = UniqueEmail();
        var client = factory.CreateClient();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = ExtractAuthCookie(login);
        return (client, cookie);
    }

    [Fact]
    public async Task Patch_contact_can_update_profile_fields()
    {
        var (client, cookie) = await RegisterAndLogin(_factory);

        var createPayload = new
        {
            displayName = "Alice Example",
            initials = "AE",
            role = "Investor",
            organization = "ACME Capital",
            location = "NYC",
            tags = new[] { "vc", "portfolio" },
            emails = new[] { "alice@acme.com" },
            phones = new[] { "+15551234567" },
        };

        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(createPayload),
        };
        createReq.Headers.Add("Cookie", cookie);
        var createRes = await client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);

        var createBody = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var id = createBody.GetProperty("id").GetGuid();

        var patchPayload = new
        {
            displayName = "Alice Smith",
            role = "CTO",
            organization = "ACME Tech",
            location = "San Francisco",
            tags = new[] { "investor", "cto", "advisor" },
        };

        using var patchReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/contacts/{id}")
        {
            Content = JsonContent.Create(patchPayload),
        };
        patchReq.Headers.Add("Cookie", cookie);
        var patchRes = await client.SendAsync(patchReq);
        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);

        var patchBody = await patchRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("Alice Smith", patchBody.GetProperty("displayName").GetString());
        Assert.Equal("CTO", patchBody.GetProperty("role").GetString());
        Assert.Equal("ACME Tech", patchBody.GetProperty("organization").GetString());
        Assert.Equal("San Francisco", patchBody.GetProperty("location").GetString());
    }
}
