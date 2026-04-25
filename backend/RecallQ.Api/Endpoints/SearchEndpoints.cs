using System.Security.Cryptography;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pgvector;
using Prometheus;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Observability;
using RecallQ.Api.Security;

namespace RecallQ.Api.Endpoints;

public static class SearchEndpoints
{
    public record SearchRequest(string? Q, int? Page, int? PageSize, string? Sort);
    public record SearchRow(Guid ContactId, string MatchedSource, float Similarity, string MatchedText, DateTime? OccurredAt, long TotalMatches);

    public static IEndpointRouteBuilder MapSearch(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/search", (SearchRequest req, AppDbContext db, ICurrentUser cu, IEmbeddingClient c, EmbeddingBackfillRunner r, ILoggerFactory lf)
            => Handle(req?.Q, req?.Page, req?.PageSize, req?.Sort, db, cu, c, r, lf)).RequireAuthorization().RequireRateLimiting("search");
        app.MapGet("/api/search", (string? q, int? page, int? pageSize, string? sort, AppDbContext db, ICurrentUser cu, IEmbeddingClient c, EmbeddingBackfillRunner r, ILoggerFactory lf)
            => Handle(q, page, pageSize, sort, db, cu, c, r, lf)).RequireAuthorization().RequireRateLimiting("search");
        return app;
    }

    private static async Task<IResult> Handle(string? rawQ, int? pageIn, int? pageSizeIn, string? sortIn, AppDbContext db, ICurrentUser current,
        IEmbeddingClient client, EmbeddingBackfillRunner runner, ILoggerFactory lf)
    {
        using var _timer = RecallQMetrics.SearchLatencySeconds.NewTimer();
        var logger = lf.CreateLogger("Search");
        var q = (rawQ ?? "").Trim();
        if (q.Length == 0) return Results.ValidationProblem(new Dictionary<string, string[]> { ["q"] = new[] { "Query is required." } });
        if (q.Length > 500) return Results.ValidationProblem(new Dictionary<string, string[]> { ["q"] = new[] { "Query must be <= 500 chars." } });
        var sort = string.IsNullOrWhiteSpace(sortIn) ? "similarity" : sortIn.Trim().ToLowerInvariant();
        if (sort != "similarity" && sort != "recent")
            return Results.ValidationProblem(new Dictionary<string, string[]> { ["sort"] = new[] { "sort must be 'similarity' or 'recent'." } });
        var page = pageIn is null or < 1 ? 1 : pageIn.Value;
        var pageSize = pageSizeIn is null or < 1 ? 50 : Math.Min(pageSizeIn.Value, 50);
        var hashHex = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(q))).ToLowerInvariant()[..12];
        logger.LogInformation("Search q_len={len} q_hash={hash} sort={sort}", q.Length, hashHex, sort);

        var userId = current.UserId!.Value;
        var ceTotal = await db.ContactEmbeddings.CountAsync();
        var ceMatch = await db.ContactEmbeddings.CountAsync(e => e.Model == client.Model);
        var ieTotal = await db.InteractionEmbeddings.CountAsync();
        var ieMatch = await db.InteractionEmbeddings.CountAsync(e => e.Model == client.Model);
        var total = ceTotal + ieTotal;
        if (total == 0) return Results.Ok(new { results = Array.Empty<object>(), totalCount = 0, page, pageSize, nextPage = (int?)null });
        if ((ceMatch + ieMatch) * 2 < total)
        {
            runner.StartInBackground(userId);
            return Results.Json(new { message = "Embeddings are being regenerated" }, statusCode: StatusCodes.Status503ServiceUnavailable);
        }

        var orderBy = sort == "recent" ? @"""OccurredAt"" DESC NULLS LAST, ""Similarity"" DESC" : @"""Similarity"" DESC";
        var sql = $@"
WITH hits AS (
  SELECT c.id AS ""ContactId"", 'contact'::text AS ""MatchedSource"",
         (1 - (ce.embedding <=> CAST(@q AS vector)))::real AS ""Similarity"",
         c.display_name || COALESCE(' · ' || c.role, '') || COALESCE(' · ' || c.organization, '') AS ""MatchedText"",
         NULL::timestamptz AS ""OccurredAt""
  FROM contact_embeddings ce JOIN contacts c ON c.id = ce.contact_id
  WHERE ce.owner_user_id = @owner AND ce.failed = FALSE
  UNION ALL
  SELECT i.contact_id, 'interaction'::text,
         (1 - (ie.embedding <=> CAST(@q AS vector)))::real,
         COALESCE(i.subject || E'\n', '') || i.content,
         i.occurred_at
  FROM interaction_embeddings ie JOIN interactions i ON i.id = ie.interaction_id
  WHERE ie.owner_user_id = @owner AND ie.failed = FALSE
),
collapsed AS (
  SELECT DISTINCT ON (""ContactId"") ""ContactId"", ""MatchedSource"", ""Similarity"", ""MatchedText"", ""OccurredAt""
  FROM hits ORDER BY ""ContactId"", ""Similarity"" DESC
)
SELECT ""ContactId"", ""MatchedSource"", ""Similarity"", ""MatchedText"", ""OccurredAt"",
       COUNT(*) OVER () AS ""TotalMatches""
FROM collapsed ORDER BY {orderBy} LIMIT @limit OFFSET @offset";

        var vec = new Vector(await client.EmbedAsync(q, default));
        var rows = await db.Database.SqlQueryRaw<SearchRow>(sql,
            new NpgsqlParameter("q", vec), new NpgsqlParameter("owner", userId),
            new NpgsqlParameter("limit", pageSize), new NpgsqlParameter("offset", (page - 1) * pageSize)).ToListAsync();

        var mapped = rows.Select(r => new {
            contactId = r.ContactId, matchedSource = r.MatchedSource,
            similarity = Math.Round(r.Similarity, 2),
            matchedText = Truncate((r.MatchedText ?? "").Trim(), 240),
            occurredAt = r.OccurredAt
        }).ToList();
        var totalMatches = rows.Count == 0 ? 0 : (int)rows[0].TotalMatches;
        return Results.Ok(new { results = mapped, totalCount = totalMatches, page, pageSize, nextPage = rows.Count == pageSize ? page + 1 : (int?)null });
    }

    private static string Truncate(string text, int max)
    {
        if (text.Length <= max) return text;
        var slice = text[..(max - 1)];
        var sp = slice.LastIndexOf(' ');
        slice = sp > 0 ? slice[..sp] : slice;
        return slice.TrimEnd(' ', '\t', '\n', '\r', '.', ',', ';', ':', '!', '?') + "…";
    }
}
