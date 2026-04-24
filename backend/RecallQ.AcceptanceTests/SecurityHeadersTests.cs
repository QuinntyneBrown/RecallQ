// Traces to: L2-057
// Task: T028
namespace RecallQ.AcceptanceTests;

public class SecurityHeadersTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public SecurityHeadersTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Hsts_and_csp_present_on_every_response()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/ping");
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);

        Assert.True(response.Headers.Contains("Strict-Transport-Security"), "Strict-Transport-Security missing");
        Assert.Contains("max-age=31536000", string.Join(";", response.Headers.GetValues("Strict-Transport-Security")));

        Assert.True(response.Headers.Contains("Content-Security-Policy"), "Content-Security-Policy missing");
        var csp = string.Join(";", response.Headers.GetValues("Content-Security-Policy"));
        var expectedCsp =
            "default-src 'self'; " +
            "connect-src 'self' https://api.openai.com; " +
            "img-src 'self' data:; " +
            "style-src 'self' 'unsafe-inline'; " +
            "font-src 'self'; " +
            "frame-ancestors 'none'";
        Assert.Equal(expectedCsp, csp);
        Assert.DoesNotContain("unsafe-eval", csp);

        Assert.True(response.Headers.Contains("X-Content-Type-Options"));
        Assert.Equal("nosniff", string.Join(";", response.Headers.GetValues("X-Content-Type-Options")));

        Assert.True(response.Headers.Contains("Referrer-Policy"));
        Assert.Equal("strict-origin-when-cross-origin", string.Join(";", response.Headers.GetValues("Referrer-Policy")));

        Assert.True(response.Headers.Contains("X-Frame-Options"));
        Assert.Equal("DENY", string.Join(";", response.Headers.GetValues("X-Frame-Options")));
    }
}
