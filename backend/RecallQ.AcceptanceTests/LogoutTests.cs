// Traces to: L2-003, L2-004
// Task: T006
using System.Net;
using System.Net.Http.Json;

namespace RecallQ.AcceptanceTests;

public class LogoutTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public LogoutTests(RecallqFactory factory)
    {
        _factory = factory;
    }

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

    [Fact]
    public async Task Logout_invalidates_cookie()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, loginResponse.StatusCode);
        var cookie = ExtractAuthCookie(loginResponse);

        using (var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me"))
        {
            meReq.Headers.Add("Cookie", cookie);
            var meRes = await client.SendAsync(meReq);
            Assert.Equal(HttpStatusCode.OK, meRes.StatusCode);
        }

        HttpResponseMessage logoutRes;
        using (var logoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout"))
        {
            logoutReq.Headers.Add("Cookie", cookie);
            logoutRes = await client.SendAsync(logoutReq);
        }
        Assert.Equal(HttpStatusCode.NoContent, logoutRes.StatusCode);
        Assert.True(logoutRes.Headers.TryGetValues("Set-Cookie", out var setCookies));
        var cleared = string.Join(";", setCookies!);
        Assert.Contains("rq_auth=", cleared);
        Assert.True(cleared.Contains("expires=Thu, 01 Jan 1970", StringComparison.OrdinalIgnoreCase)
            || cleared.Contains("rq_auth=;", StringComparison.Ordinal));

        using (var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me"))
        {
            meReq.Headers.Add("Cookie", cookie);
            var meRes = await client.SendAsync(meReq);
            Assert.Equal(HttpStatusCode.Unauthorized, meRes.StatusCode);
        }
    }

    [Fact]
    public async Task Protected_endpoint_with_revoked_cookie_returns_401()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        var loginResponse = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        var cookie = ExtractAuthCookie(loginResponse);

        using (var logoutReq = new HttpRequestMessage(HttpMethod.Post, "/api/auth/logout"))
        {
            logoutReq.Headers.Add("Cookie", cookie);
            var logoutRes = await client.SendAsync(logoutReq);
            Assert.Equal(HttpStatusCode.NoContent, logoutRes.StatusCode);
        }

        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var meRes = await client.SendAsync(meReq);
        Assert.Equal(HttpStatusCode.Unauthorized, meRes.StatusCode);
    }
}
