// Traces to: L2-086, L2-087, L2-088
using System.Collections.Concurrent;
using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Security;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

[Collection("PasswordRecovery")]
public class ForgotPasswordTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public ForgotPasswordTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    private const string GoodPassword = "correcthorse12";
    private static string UniqueEmail() => $"forgot-{Guid.NewGuid():N}@example.com";

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

    private static async Task RegisterAsync(HttpClient client, string email)
    {
        var response = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
    }

    [Fact]
    public async Task Forgot_password_for_existing_user_returns_202_and_emails_sender()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var sent = Assert.Single(sender.Sent);
        Assert.Equal(email, sent.Email);
        Assert.True(sent.RawToken.Length >= 43);
        Assert.Equal(TimeSpan.FromMinutes(60), sent.Ttl);
    }

    [Fact]
    public async Task Forgot_password_for_unknown_email_returns_202_and_no_email_sent()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email = UniqueEmail() });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        Assert.Empty(sender.Sent);
    }

    [Fact]
    public async Task Forgot_password_with_invalid_email_returns_400()
    {
        var client = _factory.WithWebHostBuilder(_ => { }).CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email = "not-an-email" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Forgot_password_with_empty_email_returns_400()
    {
        var client = _factory.WithWebHostBuilder(_ => { }).CreateClient();

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email = "" });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Issued_token_is_persisted_only_as_sha256_hash()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var rawToken = Assert.Single(sender.Sent).RawToken;
        using var scope = factory.Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<PasswordResetTokenService>();
        var hash = tokenService.Hash(rawToken);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var row = await db.PasswordResetTokens.SingleAsync(t => t.TokenHash == hash);
        Assert.DoesNotContain(rawToken, row.TokenHash, StringComparison.Ordinal);
        Assert.Equal(64, row.TokenHash.Length);
    }

    [Fact]
    public async Task Issued_token_expires_in_60_minutes_default()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var rawToken = Assert.Single(sender.Sent).RawToken;
        using var scope = factory.Services.CreateScope();
        var tokenService = scope.ServiceProvider.GetRequiredService<PasswordResetTokenService>();
        var hash = tokenService.Hash(rawToken);
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var row = await db.PasswordResetTokens.SingleAsync(t => t.TokenHash == hash);
        var ttl = row.ExpiresAt - row.CreatedAt;
        Assert.InRange(ttl.TotalMinutes, 59, 61);
    }

    [Fact]
    public async Task Sixth_forgot_password_in_60s_returns_429_with_retry_after()
    {
        using var factory = _factory.WithWebHostBuilder(_ => { });
        var client = factory.CreateClient();
        var email = UniqueEmail();
        HttpResponseMessage? last = null;

        for (var i = 0; i < 6; i++)
        {
            last = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });
        }

        Assert.NotNull(last);
        Assert.Equal((HttpStatusCode)429, last!.StatusCode);
        Assert.True(last.Headers.TryGetValues("Retry-After", out var retryAfter));
        Assert.False(string.IsNullOrWhiteSpace(retryAfter!.FirstOrDefault()));
    }

    [Fact]
    public async Task Email_body_contains_only_link_ttl_and_disclaimer_no_password()
    {
        var sender = new FakePasswordResetEmailSender();
        using var factory = WithFakeSender(sender);
        var client = factory.CreateClient();
        var email = UniqueEmail();
        await RegisterAsync(client, email);

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var sent = Assert.Single(sender.Sent);
        Assert.Contains("/reset-password?token=", sent.Body);
        Assert.Contains("60 minutes", sent.Body);
        Assert.Contains("If you did not request this", sent.Body);
        Assert.DoesNotContain(GoodPassword, sent.Body);
    }
}

[Collection("PasswordRecovery")]
public class ForgotPasswordLoggingTests : IClassFixture<ObservabilityFactory>
{
    private readonly ObservabilityFactory _factory;

    public ForgotPasswordLoggingTests(ObservabilityFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Logs_redact_local_part_of_email()
    {
        _factory.Sink.Clear();
        var client = _factory.CreateClient();
        var email = $"alice.local-{Guid.NewGuid():N}@example.com";
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = "correcthorse12" });

        var response = await client.PostAsJsonAsync("/api/auth/forgot-password", new { email });

        Assert.Equal(HttpStatusCode.Accepted, response.StatusCode);
        var joined = string.Join("\n", _factory.Sink.Events.Select(e => e.CompactJson));
        Assert.Contains("*@example.com", joined);
        Assert.DoesNotContain("alice.local", joined);
        Assert.Contains("link_present", joined, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("ttl_minutes", joined, StringComparison.OrdinalIgnoreCase);
        Assert.Contains("contains_password", joined, StringComparison.OrdinalIgnoreCase);
    }
}

public sealed record SentResetEmail(string Email, string RawToken, TimeSpan Ttl, string Body);

public sealed class FakePasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly ConcurrentQueue<SentResetEmail> _sent = new();

    public IReadOnlyList<SentResetEmail> Sent => _sent.ToArray();

    public Task SendAsync(string email, string rawToken, TimeSpan ttl, CancellationToken ct)
    {
        var body =
            $"Use this secure link to reset your RecallQ password: http://localhost:4200/reset-password?token={rawToken}\n" +
            $"This link expires in {(int)Math.Ceiling(ttl.TotalMinutes)} minutes.\n" +
            "If you did not request this, ignore this email.";
        _sent.Enqueue(new SentResetEmail(email, rawToken, ttl, body));
        return Task.CompletedTask;
    }
}

[CollectionDefinition("PasswordRecovery", DisableParallelization = true)]
public sealed class PasswordRecoveryCollection
{
}
