// Traces to: L2-001, L2-002, L2-052, L2-055
// Task: T005
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Npgsql;

namespace RecallQ.AcceptanceTests;

public class AuthTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public AuthTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string GoodPassword = "correcthorse12";

    [Fact]
    public async Task Register_creates_user_returns_201()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        Assert.Equal(email, doc.RootElement.GetProperty("email").GetString());
        Assert.True(doc.RootElement.TryGetProperty("id", out _));
        Assert.False(doc.RootElement.TryGetProperty("passwordHash", out _));
    }

    [Fact]
    public async Task Register_duplicate_email_returns_409()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        var first = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, first.StatusCode);
        var second = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Conflict, second.StatusCode);
    }

    [Fact]
    public async Task Register_weak_password_returns_400()
    {
        var client = _factory.CreateClient();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email = UniqueEmail(), password = "short1" });
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Login_valid_credentials_sets_cookie_and_returns_200()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        var response = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        var cookie = string.Join(";", cookies!);
        Assert.Contains("rq_auth=", cookie);
        Assert.Contains("httponly", cookie, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("samesite=strict", cookie, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Login_wrong_password_returns_401_generic()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        var wrong = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "wrongpassword12" });
        Assert.Equal(HttpStatusCode.Unauthorized, wrong.StatusCode);
        var body1 = await wrong.Content.ReadAsByteArrayAsync();

        var unknown = await client.PostAsJsonAsync("/api/auth/login", new { email = UniqueEmail(), password = "wrongpassword12" });
        var body2 = await unknown.Content.ReadAsByteArrayAsync();
        Assert.True(body1.SequenceEqual(body2));
    }

    [Fact]
    public async Task Login_unknown_email_returns_same_401()
    {
        var client = _factory.CreateClient();
        var emailA = UniqueEmail();
        await client.PostAsJsonAsync("/api/auth/register", new { email = emailA, password = GoodPassword });
        var wrongPw = await client.PostAsJsonAsync("/api/auth/login", new { email = emailA, password = "wrongpassword12" });
        var unknown = await client.PostAsJsonAsync("/api/auth/login", new { email = UniqueEmail(), password = "wrongpassword12" });
        Assert.Equal(HttpStatusCode.Unauthorized, wrongPw.StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized, unknown.StatusCode);
        var body1 = await wrongPw.Content.ReadAsByteArrayAsync();
        var body2 = await unknown.Content.ReadAsByteArrayAsync();
        Assert.True(body1.SequenceEqual(body2));
    }

    [Fact]
    public async Task Sixth_login_per_email_ip_in_60s_returns_429()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        HttpResponseMessage? last = null;
        for (int i = 0; i < 6; i++)
        {
            last = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "wrongpassword12" });
        }
        Assert.Equal((HttpStatusCode)429, last!.StatusCode);
    }

    [Fact]
    public async Task RateLimit_429_includes_retry_after_header_and_json_body()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        HttpResponseMessage? last = null;
        for (int i = 0; i < 6; i++)
        {
            last = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "wrongpassword12" });
        }
        Assert.NotNull(last);
        Assert.Equal((HttpStatusCode)429, last!.StatusCode);

        Assert.True(
            last.Headers.TryGetValues("Retry-After", out var retryHeader),
            "Retry-After header is missing");
        var headerValue = retryHeader!.FirstOrDefault();
        Assert.False(string.IsNullOrEmpty(headerValue));
        Assert.True(int.TryParse(headerValue, out var headerSeconds), "Retry-After must be an integer");
        Assert.True(headerSeconds > 0);

        var body = await last.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal("rate_limited", body.GetProperty("error").GetString());
        Assert.Equal(headerSeconds, body.GetProperty("retryAfter").GetInt32());
    }

    [Fact]
    public async Task Password_hash_is_argon2id_not_plain()
    {
        var client = _factory.CreateClient();
        var email = UniqueEmail();
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        await using var conn = new NpgsqlConnection(_factory.ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand("SELECT password_hash FROM users WHERE email = @e", conn);
        cmd.Parameters.AddWithValue("e", email);
        var hash = (string?)await cmd.ExecuteScalarAsync();
        Assert.NotNull(hash);
        Assert.StartsWith("$argon2id$", hash);
        Assert.DoesNotContain(GoodPassword, hash);
    }
}
