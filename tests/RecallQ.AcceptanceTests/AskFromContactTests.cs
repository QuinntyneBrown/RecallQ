// Traces to: L2-040
// Task: T024
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api.Chat;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class AskFromContactTests : IClassFixture<AskFactory>
{
    private readonly AskFactory _factory;
    public AskFromContactTests(AskFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"askctx{Guid.NewGuid():N}@example.com";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    [Fact]
    public async Task Ask_with_contactId_prepends_that_contact_to_context()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);

        var payload = new
        {
            displayName = "QUASAR_CONTACT_ALPHA_42",
            initials = "QA",
            role = "VP",
            organization = (string?)null,
            location = (string?)null,
            tags = Array.Empty<string>(),
            emails = Array.Empty<string>(),
            phones = Array.Empty<string>(),
        };
        using var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
        createReq.Headers.Add("Cookie", cookie);
        var createRes = await client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdBody = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var contactId = createdBody.GetProperty("id").GetGuid();

        using var askReq = new HttpRequestMessage(HttpMethod.Post, "/api/ask")
        {
            Content = JsonContent.Create(new { q = "hi", contactId })
        };
        askReq.Headers.Add("Cookie", cookie);
        using var res = await client.SendAsync(askReq, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);

        using var stream = await res.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        while (await reader.ReadLineAsync() != null) { }

        var fake = (FakeChatClient)_factory.Services.GetRequiredService<IChatClient>();
        Assert.Contains("QUASAR_CONTACT_ALPHA_42", fake.LastSystemPrompt);
    }
}
