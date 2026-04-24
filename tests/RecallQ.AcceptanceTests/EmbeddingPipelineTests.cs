// Traces to: L2-071, L2-073, L2-078
// Task: T011
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class EmbeddingPipelineTests : IClassFixture<EmbeddingWorkerFactory>
{
    private readonly EmbeddingWorkerFactory _factory;
    public EmbeddingPipelineTests(EmbeddingWorkerFactory factory) { _factory = factory; }

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

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterAndLogin(string email)
    {
        var client = _factory.CreateClient();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = ExtractAuthCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        var userId = body.GetProperty("id").GetGuid();
        return (client, userId, cookie);
    }

    private static async Task<Guid> CreateContact(HttpClient client, string cookie, string displayName)
    {
        var payload = new
        {
            displayName,
            initials = "ZZ",
            role = "Role",
            organization = "Org",
            location = "Loc",
            tags = new[] { "t" },
            emails = new[] { "z@z.com" },
            phones = new[] { "+15550000000" },
        };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    [Fact]
    public async Task Creating_contact_produces_embedding_row_within_30s()
    {
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var id = await CreateContact(client, cookie, "Embedding Target " + Guid.NewGuid().ToString("N"));

        var deadline = DateTime.UtcNow.AddSeconds(30);
        ContactEmbedding? row = null;
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            row = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == id);
            if (row is not null && !row.Failed) break;
            await Task.Delay(100);
        }

        Assert.NotNull(row);
        Assert.Equal("fake-deterministic", row!.Model);
        Assert.False(row.Failed);
        Assert.NotNull(row.Embedding);
    }

    [Fact]
    public async Task Source_text_never_appears_in_logs()
    {
        _factory.LogMessages.Clear();
        var secret = "ZANZIBAR_SECRET_TOKEN_42";
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var id = await CreateContact(client, cookie, secret);

        var deadline = DateTime.UtcNow.AddSeconds(30);
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == id);
            if (row is not null && !row.Failed) break;
            await Task.Delay(100);
        }

        Assert.DoesNotContain(_factory.LogMessages, m => m.Contains(secret));
    }

    [Fact]
    public async Task Transient_failure_retries_3_times_then_marks_failed()
    {
        // Spin up a dedicated factory with a flaky client
        await using var flakyFactory = new EmbeddingWorkerFactory();
        flakyFactory.EmbeddingClientFactory = _ => new FlakyEmbeddingClient(new FakeEmbeddingClient(), int.MaxValue);
        await ((IAsyncLifetime)flakyFactory).InitializeAsync();

        try
        {
            var fclient = flakyFactory.CreateClient();
            var email = UniqueEmail();
            var reg = await fclient.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
            Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
            var login = await fclient.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
            var cookie = ExtractAuthCookie(login);
            var id = await CreateContact(fclient, cookie, "Flaky Target");

            var deadline = DateTime.UtcNow.AddSeconds(10);
            ContactEmbedding? row = null;
            while (DateTime.UtcNow < deadline)
            {
                using var scope = flakyFactory.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                row = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == id);
                if (row is not null && row.Failed) break;
                await Task.Delay(100);
            }

            Assert.NotNull(row);
            Assert.True(row!.Failed);
            Assert.Equal(3, row.Attempts);
            Assert.NotNull(row.LastError);
            Assert.Contains("transient", row.LastError!);
        }
        finally
        {
            await ((IAsyncLifetime)flakyFactory).DisposeAsync();
        }
    }
}
