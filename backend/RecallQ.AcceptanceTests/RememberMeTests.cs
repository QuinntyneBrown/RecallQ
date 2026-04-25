// Traces to: L2-085
using System.Net;
using System.Net.Http.Json;

namespace RecallQ.AcceptanceTests;

public class RememberMeTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public RememberMeTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    private static string UniqueEmail() => $"remember-{Guid.NewGuid():N}@example.com";
    private const string GoodPassword = "correcthorse12";

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static string ExtractAuthSetCookie(HttpResponseMessage response)
    {
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        foreach (var cookie in cookies!)
        {
            if (cookie.StartsWith("rq_auth=", StringComparison.Ordinal))
            {
                return cookie;
            }
        }

        throw new Xunit.Sdk.XunitException("rq_auth Set-Cookie header not found");
    }

    private static string ExtractCookiePair(string setCookie)
    {
        var semi = setCookie.IndexOf(';');
        return semi >= 0 ? setCookie[..semi] : setCookie;
    }

    private static DateTimeOffset? ExtractExpires(string setCookie)
    {
        foreach (var part in setCookie.Split(';', StringSplitOptions.TrimEntries))
        {
            if (part.StartsWith("expires=", StringComparison.OrdinalIgnoreCase)
                && DateTimeOffset.TryParse(part["expires=".Length..], out var expires))
            {
                return expires;
            }
        }

        return null;
    }

    [Fact]
    public async Task Login_with_rememberMe_true_sets_cookie_with_30d_expires()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var before = DateTimeOffset.UtcNow;
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword, rememberMe = true });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookie = ExtractAuthSetCookie(response);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", cookie, StringComparison.OrdinalIgnoreCase);
        var expires = ExtractExpires(cookie);
        Assert.NotNull(expires);
        Assert.True(expires.Value >= before.AddDays(29), $"Expected Expires at least 29 days out, got {expires.Value:O}");
        Assert.True(expires.Value <= before.AddDays(31), $"Expected Expires near 30 days out, got {expires.Value:O}");
    }

    [Fact]
    public async Task Login_with_rememberMe_false_sets_session_cookie()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword, rememberMe = false });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookie = ExtractAuthSetCookie(response);
        Assert.DoesNotContain("expires=", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("max-age=", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_with_rememberMe_omitted_defaults_to_session_cookie()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var cookie = ExtractAuthSetCookie(response);
        Assert.DoesNotContain("expires=", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("max-age=", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Persistent_cookie_after_logout_returns_401_on_me()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword, rememberMe = true });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var cookiePair = ExtractCookiePair(ExtractAuthSetCookie(loginResponse));

        using (var logoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout"))
        {
            logoutReq.Headers.Add("Cookie", cookiePair);
            var logoutRes = await client.SendAsync(logoutReq);
            Assert.Equal(HttpStatusCode.NoContent, logoutRes.StatusCode);
        }

        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookiePair);
        var meRes = await client.SendAsync(meReq);
        Assert.Equal(HttpStatusCode.Unauthorized, meRes.StatusCode);
    }
}
