// Task: T013 — EXPLAIN ANALYZE reference fixture for vector search SQL.
using System.Net;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using Pgvector;
using RecallQ.Api;
using RecallQ.Api.Embeddings;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class SearchExplainTests : IClassFixture<EmbeddingWorkerFactory>
{
    private readonly EmbeddingWorkerFactory _factory;
    public SearchExplainTests(EmbeddingWorkerFactory f) { _factory = f; }

    [Fact]
    public async Task PrintExplainAnalyze_ForReference()
    {
        // Seed a small dataset
        var email = $"explain{Guid.NewGuid():N}@example.com";
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = "correcthorse12" });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = "correcthorse12" });
        login.Headers.TryGetValues("Set-Cookie", out var cookies);
        string cookie = "";
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=")) { var s = c.IndexOf(';'); cookie = s > 0 ? c[..s] : c; }

        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var meBody = await me.Content.ReadFromJsonAsync<JsonElement>();
        var userId = meBody.GetProperty("id").GetGuid();

        for (int i = 0; i < 3; i++)
        {
            var payload = new { displayName = $"Explain Sample {i}", initials = "ES", tags = Array.Empty<string>(), emails = Array.Empty<string>(), phones = Array.Empty<string>() };
            using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        }

        var deadline = DateTime.UtcNow.AddSeconds(30);
        while (DateTime.UtcNow < deadline)
        {
            using var s = _factory.Services.CreateScope();
            var db = s.ServiceProvider.GetRequiredService<AppDbContext>();
            if (await db.ContactEmbeddings.IgnoreQueryFilters().CountAsync(e => e.OwnerUserId == userId && !e.Failed) >= 3) break;
            await Task.Delay(100);
        }

        using var scope = _factory.Services.CreateScope();
        var ctx = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var fake = new FakeEmbeddingClient();
        var vec = new Vector(await fake.EmbedAsync("explain sample query", default));

        const string sql = @"EXPLAIN ANALYZE
WITH hits AS (
  SELECT c.id AS ""ContactId"", 'contact'::text AS ""MatchedSource"",
         (1 - (ce.embedding <=> CAST(@q AS vector)))::real AS ""Similarity"",
         c.display_name AS ""MatchedText"",
         NULL::timestamptz AS ""OccurredAt""
  FROM contact_embeddings ce JOIN contacts c ON c.id = ce.contact_id
  WHERE ce.owner_user_id = @owner AND ce.failed = FALSE
  UNION ALL
  SELECT i.contact_id, 'interaction'::text,
         (1 - (ie.embedding <=> CAST(@q AS vector)))::real,
         i.content, i.occurred_at
  FROM interaction_embeddings ie JOIN interactions i ON i.id = ie.interaction_id
  WHERE ie.owner_user_id = @owner AND ie.failed = FALSE
),
collapsed AS (
  SELECT DISTINCT ON (""ContactId"") ""ContactId"", ""MatchedSource"", ""Similarity"", ""MatchedText"", ""OccurredAt""
  FROM hits ORDER BY ""ContactId"", ""Similarity"" DESC
)
SELECT ""ContactId"", ""MatchedSource"", ""Similarity"", ""MatchedText"", ""OccurredAt""
FROM collapsed ORDER BY ""Similarity"" DESC LIMIT 50 OFFSET 0";

        var lines = new StringBuilder();
        lines.AppendLine("-- EXPLAIN ANALYZE for T013 vector search SQL (reference fixture)");
        lines.AppendLine($"-- Generated {DateTime.UtcNow:O} on pgvector/pgvector:pg16 with HNSW cosine indexes.");
        lines.AppendLine();
        var conn = ctx.Database.GetDbConnection();
        if (conn.State != System.Data.ConnectionState.Open) await conn.OpenAsync();
        await using (var pre = conn.CreateCommand())
        {
            pre.CommandText = "SET enable_seqscan = off;";
            try { await pre.ExecuteNonQueryAsync(); } catch { /* ignore if no tx */ }
        }
        await using (var cmd = conn.CreateCommand())
        {
            cmd.CommandText = sql;
            cmd.Parameters.Add(new NpgsqlParameter("q", vec));
            cmd.Parameters.Add(new NpgsqlParameter("owner", userId));
            await using var rdr = await cmd.ExecuteReaderAsync();
            while (await rdr.ReadAsync()) lines.AppendLine(rdr.GetString(0));
        }

        var repoRoot = Path.GetFullPath(Path.Combine(AppContext.BaseDirectory, "..", "..", "..", ".."));
        var target = Path.Combine(repoRoot, "RecallQ.AcceptanceTests", "Fixtures", "search_explain.txt");
        if (!File.Exists(target))
        {
            // fallback: project-local path
            target = Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "Fixtures", "search_explain.txt");
        }
        Directory.CreateDirectory(Path.GetDirectoryName(target)!);
        await File.WriteAllTextAsync(target, lines.ToString());

        Assert.True(File.Exists(target));
        var contents = await File.ReadAllTextAsync(target);
        Assert.Contains("Scan", contents);
    }
}
