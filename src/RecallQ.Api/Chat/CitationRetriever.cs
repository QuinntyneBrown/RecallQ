using Microsoft.EntityFrameworkCore;
using Npgsql;
using Pgvector;
using RecallQ.Api.Embeddings;

namespace RecallQ.Api.Chat;

public record Citation(Guid ContactId, string ContactName, string Snippet, double Similarity, string Source);

public class CitationRetriever
{
    private readonly AppDbContext _db;
    private readonly IEmbeddingClient _embeddings;

    public CitationRetriever(AppDbContext db, IEmbeddingClient embeddings)
    {
        _db = db;
        _embeddings = embeddings;
    }

    private record Row(Guid ContactId, string ContactName, string MatchedText, float Similarity, string Source);

    public async Task<IReadOnlyList<Citation>> RetrieveAsync(Guid ownerUserId, string q, int k, CancellationToken ct)
    {
        if (string.IsNullOrWhiteSpace(q) || k <= 0) return Array.Empty<Citation>();

        var ceTotal = await _db.ContactEmbeddings.IgnoreQueryFilters()
            .CountAsync(e => e.OwnerUserId == ownerUserId && !e.Failed && e.Model == _embeddings.Model, ct);
        var ieTotal = await _db.InteractionEmbeddings.IgnoreQueryFilters()
            .CountAsync(e => e.OwnerUserId == ownerUserId && !e.Failed && e.Model == _embeddings.Model, ct);
        if (ceTotal + ieTotal == 0) return Array.Empty<Citation>();

        var vec = new Vector(await _embeddings.EmbedAsync(q, ct));

        const string sql = @"
WITH hits AS (
  SELECT c.id AS ""ContactId"", c.display_name AS ""ContactName"",
         c.display_name || COALESCE(' · ' || c.role, '') || COALESCE(' · ' || c.organization, '') AS ""MatchedText"",
         (1 - (ce.embedding <=> CAST(@q AS vector)))::real AS ""Similarity"",
         'contact'::text AS ""Source""
  FROM contact_embeddings ce JOIN contacts c ON c.id = ce.contact_id
  WHERE ce.owner_user_id = @owner AND ce.failed = FALSE
  UNION ALL
  SELECT i.contact_id, c.display_name,
         COALESCE(i.subject || E'\n', '') || i.content,
         (1 - (ie.embedding <=> CAST(@q AS vector)))::real,
         'interaction'::text
  FROM interaction_embeddings ie
    JOIN interactions i ON i.id = ie.interaction_id
    JOIN contacts c ON c.id = i.contact_id
  WHERE ie.owner_user_id = @owner AND ie.failed = FALSE
),
collapsed AS (
  SELECT DISTINCT ON (""ContactId"") ""ContactId"", ""ContactName"", ""MatchedText"", ""Similarity"", ""Source""
  FROM hits ORDER BY ""ContactId"", ""Similarity"" DESC
)
SELECT ""ContactId"", ""ContactName"", ""MatchedText"", ""Similarity"", ""Source""
FROM collapsed ORDER BY ""Similarity"" DESC LIMIT @limit";

        var rows = await _db.Database.SqlQueryRaw<Row>(sql,
            new NpgsqlParameter("q", vec),
            new NpgsqlParameter("owner", ownerUserId),
            new NpgsqlParameter("limit", k)).ToListAsync(ct);

        return rows.Select(r => new Citation(
            r.ContactId,
            r.ContactName,
            Truncate((r.MatchedText ?? string.Empty).Trim(), 200),
            Math.Round(Math.Clamp((double)r.Similarity, 0.0, 1.0), 2),
            r.Source)).ToList();
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
