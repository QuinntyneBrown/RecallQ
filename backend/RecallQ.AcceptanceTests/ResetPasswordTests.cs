// Traces to: L2-088, L2-089
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Security;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

[Collection("PasswordRecovery")]
public class ResetPasswordTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public ResetPasswordTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    private const string OldPassword = "correcthorse12";
    private const string NewPassword = "betterhorse34";

    private WebApplicationFactory<Program> WithFakeSender(FakePasswordResetEmailSender sender) =>
        _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IPasswordResetEmailSender)).ToList())
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IPasswordResetEmailSender>(sender);
            });
        });

    private static string UniqueEmail() => $"reset-{Guid.NewGuid():N}@example.com";

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = OldPassword });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    private static async Task<string> IssueTokenAsync(HttpClient client, FakePasswordResetEmailSender sender, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        return sender.Sent.Last().RawToken;
    }

    private static async Task<string?> ReadErrorAsync(HttpResponseMessage response)
    {
        using var doc = JsonDocument.Parse(await response.Content.ReadAsStringAsync());
        return doc.RootElement.GetProperty("error").GetString();
    }

    private static string ExtractAuthCookie(HttpResponseMessage response)
    {
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        foreach (var cookie in cookies!)
        {
            if (cookie.StartsWith("rq_auth=", StringComparison.Ordinal))
            {
                var semi = cookie.IndexOf(';');
                return semi >= 0 ? cookie[..semi] : cookie;
            }
        }

        throw new Xunit.Sdk.XunitException("rq_auth cookie not found");
    }

    [Fact]
    public async Task Reset_with_valid_token_updates_password_hash_and_returns_200()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);
        var token = await IssueTokenAsync(client, sender, email);

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword = NewPassword });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var oldLogin = await client.PostAsJsonAsync("/api/auth/login", new { email, password = OldPassword });
        Assert.Equal(HttpStatusCode.Unauthorized, oldLogin.StatusCode);
        var newLogin = await client.PostAsJsonAsync("/api/auth/login", new { email, password = NewPassword });
        Assert.Equal(HttpStatusCode.OK, newLogin.StatusCode);
    }

    [Fact]
    public async Task Reset_with_used_token_returns_400_invalid_token()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);
        var token = await IssueTokenAsync(client, sender, email);
        var first = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword = NewPassword });
        Assert.Equal(HttpStatusCode.OK, first.StatusCode);

        var second = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword = "anotherhorse56" });

        Assert.Equal(HttpStatusCode.BadRequest, second.StatusCode);
        Assert.Equal("invalid_token", await ReadErrorAsync(second));
    }

    [Fact]
    public async Task Reset_with_expired_token_returns_400_invalid_token()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);
        var token = await IssueTokenAsync(client, sender, email);
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var tokenService = scope.ServiceProvider.GetRequiredService<PasswordResetTokenService>();
            var hash = tokenService.Hash(token);
            var row = await db.PasswordResetTokens.SingleAsync(t => t.TokenHash == hash);
            row.ExpiresAt = DateTime.UtcNow.AddMinutes(-1);
            await db.SaveChangesAsync();
        }

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword = NewPassword });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_token", await ReadErrorAsync(response));
    }

    [Fact]
    public async Task Reset_with_unknown_token_returns_400_invalid_token()
    {
        using var factory = _factory.WithWebHostBuilder(_ => { });
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token = "unknown-token", newPassword = NewPassword });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_token", await ReadErrorAsync(response));
    }

    [Fact]
    public async Task Reset_with_missing_token_returns_400_invalid_token()
    {
        using var factory = _factory.WithWebHostBuilder(_ => { });
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token = "", newPassword = NewPassword });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("invalid_token", await ReadErrorAsync(response));
    }

    [Fact]
    public async Task Reset_with_weak_password_returns_400_weak_password()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);
        var token = await IssueTokenAsync(client, sender, email);

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword = "short1" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
        Assert.Equal("weak_password", await ReadErrorAsync(response));
    }

    [Fact]
    public async Task Successful_reset_marks_other_outstanding_tokens_used()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);
        var firstToken = await IssueTokenAsync(client, sender, email);
        var secondToken = await IssueTokenAsync(client, sender, email);

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token = firstToken, newPassword = NewPassword });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        using var scope = factory.Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<PasswordResetTokenService>();
        var hashes = new[] { tokenService.Hash(firstToken), tokenService.Hash(secondToken) };
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var rows = await db.PasswordResetTokens.Where(t => hashes.Contains(t.TokenHash)).ToListAsync();
        Assert.Equal(2, rows.Count);
        Assert.All(rows, row => Assert.NotNull(row.UsedAt));
    }

    [Fact]
    public async Task Existing_session_cookie_returns_401_after_password_reset()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = OldPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = ExtractAuthCookie(login);
        var token = await IssueTokenAsync(client, sender, email);

        var reset = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword = NewPassword });
        Assert.Equal(HttpStatusCode.OK, reset.StatusCode);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);

        Assert.Equal(HttpStatusCode.Unauthorized, me.StatusCode);
    }

    [Fact]
    public async Task Eleventh_reset_attempt_in_60s_returns_429()
    {
        using var factory = _factory.WithWebHostBuilder(_ => { });
        var client = factory.CreateClient();
        HttpResponseMessage? last = null;

        for (var i = 0; i < 11; i++)
        {
            last = await client.PostAsJsonAsync("/api/auth/reset-password", new
            {
                token = $"unknown-{i}",
                newPassword = NewPassword
            });
        }

        Assert.NotNull(last);
        Assert.Equal((HttpStatusCode)429, last!.StatusCode);
    }
}

[Collection("PasswordRecovery")]
public class ResetPasswordLoggingTests : IClassFixture<ObservabilityFactory>
{
    private readonly ObservabilityFactory _factory;

    public ResetPasswordLoggingTests(ObservabilityFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Reset_does_not_log_token_or_password()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = _factory.WithWebHostBuilder(builder =>
        {
            builder.ConfigureServices(services =>
            {
                foreach (var descriptor in services.Where(d => d.ServiceType == typeof(IPasswordResetEmailSender)).ToList())
                {
                    services.Remove(descriptor);
                }

                services.AddSingleton<IPasswordResetEmailSender>(sender);
            });
        });
        var client = factory.CreateClient();
        var email = $"reset-log-{Guid.NewGuid():N}@example.com";
        var newPassword = $"secret{Guid.NewGuid():N}A1";
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = "correcthorse12" });
        var token = await ResetPasswordTestsPrivate.IssueTokenAsync(client, sender, email);
        _factory.Sink.Clear();

        var response = await client.PostAsJsonAsync("/api/auth/reset-password", new { token, newPassword });

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var joined = string.Join("\n", _factory.Sink.Events.Select(e => e.CompactJson));
        Assert.DoesNotContain(token, joined);
        Assert.DoesNotContain(newPassword, joined);
    }
}

internal static class ResetPasswordTestsPrivate
{
    public static async Task<string> IssueTokenAsync(HttpClient client, FakePasswordResetEmailSender sender, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        return sender.Sent.Last().RawToken;
    }
}
