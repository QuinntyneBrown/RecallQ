// Traces to: L2-078, L2-079, L2-080
// Task: T012
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class EmbeddingIdempotencyTests : IClassFixture<EmbeddingWorkerFactory>
{
    private readonly EmbeddingWorkerFactory _factory;
    public EmbeddingIdempotencyTests(EmbeddingWorkerFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string Pw = "correcthorse12";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterLogin()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private static async Task<Guid> CreateContact(HttpClient c, string cookie, string name)
    {
        var payload = new { displayName = name, initials = "ZZ", role = "R", organization = "O",
            location = "L", tags = new[] { "t" }, emails = new[] { "z@z.com" }, phones = new[] { "+15550000000" } };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await c.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private async Task<ContactEmbedding?> WaitForEmbedding(Guid contactId, int seconds = 30)
    {
        var deadline = DateTime.UtcNow.AddSeconds(seconds);
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == contactId);
            if (row is not null && !row.Failed) return row;
            await Task.Delay(100);
        }
        return null;
    }

    [Fact]
    public void Embedding_channel_is_bounded()
    {
        var channel = _factory.Services.GetRequiredService<Channel<EmbeddingJob>>();
        var typeName = channel.GetType().FullName ?? string.Empty;
        Assert.DoesNotContain("UnboundedChannel", typeName);
    }

    [Fact]
    public async Task Contact_patch_changing_emails_re_embeds()
    {
        var (client, userId, cookie) = await RegisterLogin();
        var id = await CreateContact(client, cookie, "Patch Re-embed " + Guid.NewGuid().ToString("N"));
        var row1 = await WaitForEmbedding(id);
        Assert.NotNull(row1);
        var hashBefore = row1!.ContentHash;

        using var patch = new HttpRequestMessage(HttpMethod.Patch, $"/api/contacts/{id}")
        {
            Content = JsonContent.Create(new { emails = new[] { "patched-" + Guid.NewGuid().ToString("N") + "@example.com" } })
        };
        patch.Headers.Add("Cookie", cookie);
        var patchRes = await client.SendAsync(patch);
        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);

        var deadline = DateTime.UtcNow.AddSeconds(15);
        string? hashAfter = null;
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == id);
            if (row is not null && !string.IsNullOrEmpty(row.ContentHash) && row.ContentHash != hashBefore)
            {
                hashAfter = row.ContentHash;
                break;
            }
            await Task.Delay(150);
        }

        Assert.NotNull(hashAfter);
        Assert.NotEqual(hashBefore, hashAfter);
    }

    [Fact]
    public async Task Re_embedding_same_content_is_idempotent()
    {
        var (_, userId, _) = await RegisterLogin();
        var (client, _, cookie) = await RegisterLogin();
        var id = await CreateContact(client, cookie, "Idem Target " + Guid.NewGuid().ToString("N"));
        var row1 = await WaitForEmbedding(id);
        Assert.NotNull(row1);
        var originalUpdated = row1!.UpdatedAt;

        var writer = _factory.Services.GetRequiredService<ChannelWriter<EmbeddingJob>>();
        await writer.WriteAsync(new EmbeddingJob(id, row1.OwnerUserId, "contact"));

        await Task.Delay(1500);

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var row2 = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == id);
        Assert.NotNull(row2);
        Assert.Equal(originalUpdated, row2!.UpdatedAt);
    }

    [Fact]
    public async Task Backfill_resumes_from_cursor_without_duplicates()
    {
        Environment.SetEnvironmentVariable("ADMIN_ENABLED", "true");
        try
        {
            var (client, userId, cookie) = await RegisterLogin();
            var ids = new List<(Guid id, DateTime createdAt)>();
            for (int i = 0; i < 6; i++)
            {
                var id = await CreateContact(client, cookie, $"Bk {i} {Guid.NewGuid():N}");
                ids.Add((id, DateTime.MinValue));
                await WaitForEmbedding(id);
            }

            // Load CreatedAt values
            using (var scope = _factory.Services.CreateScope())
            {
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var rows = await db.Contacts.IgnoreQueryFilters()
                    .Where(c => c.OwnerUserId == userId)
                    .OrderBy(c => c.CreatedAt).ThenBy(c => c.Id)
                    .ToListAsync();
                Assert.Equal(6, rows.Count);
                // Simulate cursor at 3rd contact
                var third = rows[2];
                db.BackfillCursors.Add(new BackfillCursor
                {
                    OwnerUserId = userId,
                    Table = "contacts",
                    LastProcessedCreatedAt = third.CreatedAt,
                    LastProcessedId = third.Id,
                    StartedAt = DateTime.UtcNow,
                    UpdatedAt = DateTime.UtcNow,
                    Completed = false
                });
                await db.SaveChangesAsync();
            }

            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/admin/embeddings/backfill");
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.Accepted, res.StatusCode);

            var deadline = DateTime.UtcNow.AddSeconds(30);
            while (DateTime.UtcNow < deadline)
            {
                using var scope = _factory.Services.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
                var cursor = await db.BackfillCursors.FirstOrDefaultAsync(c => c.OwnerUserId == userId && c.Table == "contacts");
                if (cursor is not null && cursor.Completed) break;
                await Task.Delay(200);
            }

            using var finalScope = _factory.Services.CreateScope();
            var finalDb = finalScope.ServiceProvider.GetRequiredService<AppDbContext>();
            var contactsCursor = await finalDb.BackfillCursors.FirstOrDefaultAsync(c => c.OwnerUserId == userId && c.Table == "contacts");
            Assert.NotNull(contactsCursor);
            Assert.True(contactsCursor!.Completed);
            var rowCount = await finalDb.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId);
            Assert.Equal(6, rowCount);
            var allMatch = await finalDb.ContactEmbeddings.IgnoreQueryFilters()
                .Where(e => e.OwnerUserId == userId).AllAsync(e => e.Model == "fake-deterministic");
            Assert.True(allMatch);
        }
        finally
        {
            Environment.SetEnvironmentVariable("ADMIN_ENABLED", null);
        }
    }

    [Fact]
    public async Task Search_returns_503_when_model_mismatch_majority()
    {
        var (client, userId, cookie) = await RegisterLogin();
        var ids = new List<Guid>();
        for (int i = 0; i < 5; i++)
        {
            var id = await CreateContact(client, cookie, $"Sm {i} {Guid.NewGuid():N}");
            ids.Add(id);
            await WaitForEmbedding(id);
        }

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var rows = await db.ContactEmbeddings.IgnoreQueryFilters()
                .Where(e => e.OwnerUserId == userId).OrderBy(e => e.ContactId).Take(4).ToListAsync();
            foreach (var r in rows) r.Model = "legacy-model";
            await db.SaveChangesAsync();
        }

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/search?q=anything");
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.ServiceUnavailable, res.StatusCode);
        var text = await res.Content.ReadAsStringAsync();
        Assert.Contains("regenerat", text, StringComparison.OrdinalIgnoreCase);
    }
}
