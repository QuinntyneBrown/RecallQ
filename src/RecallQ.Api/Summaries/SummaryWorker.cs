using System.Security.Cryptography;
using System.Text;
using System.Text.Json;
using System.Text.RegularExpressions;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Chat;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Summaries;

public class SummaryWorker : BackgroundService
{
    private readonly ChannelReader<SummaryRefreshJob> _reader;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IChatClient _chat;
    private readonly ILogger<SummaryWorker> _logger;

    public SummaryWorker(
        ChannelReader<SummaryRefreshJob> reader,
        IServiceScopeFactory scopeFactory,
        IChatClient chat,
        ILogger<SummaryWorker> logger)
    {
        _reader = reader;
        _scopeFactory = scopeFactory;
        _chat = chat;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var job in _reader.ReadAllAsync(stoppingToken))
            {
                try { await ProcessAsync(job, stoppingToken); }
                catch (OperationCanceledException) { throw; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled error processing summary job contact={ContactId}", job.ContactId);
                }
            }
        }
        catch (OperationCanceledException) { }
    }

    private static string Truncate400(string s) => s.Length <= 400 ? s : s.Substring(0, 400);

    private static string Sha256(string input)
        => Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(input))).ToLowerInvariant();

    private async Task ProcessAsync(SummaryRefreshJob job, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var contact = await db.Contacts.IgnoreQueryFilters()
            .FirstOrDefaultAsync(c => c.Id == job.ContactId && c.OwnerUserId == job.OwnerUserId, ct);
        if (contact is null) return;

        var interactions = await db.Interactions.IgnoreQueryFilters()
            .Where(i => i.ContactId == job.ContactId && i.OwnerUserId == job.OwnerUserId)
            .OrderByDescending(i => i.OccurredAt)
            .Take(20)
            .ToListAsync(ct);

        var existing = await db.RelationshipSummaries.IgnoreQueryFilters()
            .FirstOrDefaultAsync(r => r.ContactId == job.ContactId, ct);

        if (interactions.Count == 0)
        {
            var emptyHash = Sha256("");
            if (existing is null)
            {
                existing = new RelationshipSummary { ContactId = job.ContactId, OwnerUserId = job.OwnerUserId };
                db.RelationshipSummaries.Add(existing);
            }
            existing.OwnerUserId = job.OwnerUserId;
            existing.Paragraph = null;
            existing.Sentiment = "None";
            existing.InteractionCount = 0;
            existing.LastInteractionAt = null;
            existing.Model = _chat.Model;
            existing.SourceHash = emptyHash;
            existing.UpdatedAt = DateTime.UtcNow;
            await db.SaveChangesAsync(ct);
            return;
        }

        var srcText = string.Join("|", interactions.Select(i => $"{i.Id}:{i.OccurredAt:o}:{i.Type}:{Truncate400(i.Content)}"));
        var newHash = Sha256(srcText);

        if (existing is not null
            && existing.SourceHash == newHash
            && existing.Model == _chat.Model
            && existing.Paragraph is not null
            && existing.UpdatedAt > DateTime.UtcNow.AddHours(-1))
        {
            _logger.LogDebug("Skip summary contact={ContactId} model={Model} hash={Hash}", job.ContactId, _chat.Model, newHash.Substring(0, 8));
            return;
        }

        var sb = new StringBuilder();
        sb.Append("Contact: ").Append(contact.DisplayName);
        if (!string.IsNullOrWhiteSpace(contact.Role) || !string.IsNullOrWhiteSpace(contact.Organization))
            sb.Append(" (").Append(contact.Role ?? "").Append(" · ").Append(contact.Organization ?? "").Append(')');
        sb.AppendLine();
        sb.AppendLine("Recent interactions:");
        foreach (var i in interactions)
            sb.Append("- ").Append(i.OccurredAt.ToString("o")).Append(' ').Append(i.Type).Append(": ").AppendLine(Truncate400(i.Content));

        var messages = new List<ChatMessage>
        {
            new("system", "You analyze a professional relationship. Output JSON only: {\"paragraph\":\"...short 2-3 sentence summary...\",\"sentiment\":\"Warm|Neutral|Cool\"}. No markdown."),
            new("user", sb.ToString()),
        };

        string raw;
        try { raw = await _chat.CompleteAsync(messages, ct); }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Chat call failed contact={ContactId} model={Model}", job.ContactId, _chat.Model);
            raw = "";
        }

        var (paragraph, sentiment) = ParseResult(raw);

        if (existing is null)
        {
            existing = new RelationshipSummary { ContactId = job.ContactId, OwnerUserId = job.OwnerUserId };
            db.RelationshipSummaries.Add(existing);
        }
        existing.OwnerUserId = job.OwnerUserId;
        existing.Paragraph = paragraph;
        existing.Sentiment = sentiment;
        existing.InteractionCount = interactions.Count;
        existing.LastInteractionAt = interactions[0].OccurredAt;
        existing.Model = _chat.Model;
        existing.SourceHash = newHash;
        existing.UpdatedAt = DateTime.UtcNow;
        await db.SaveChangesAsync(ct);

        _logger.LogInformation("summarized contact={ContactId} model={Model} hash={Hash} sentiment={Sentiment}",
            job.ContactId, _chat.Model, newHash.Substring(0, 8), sentiment);
    }

    private static (string paragraph, string sentiment) ParseResult(string raw)
    {
        if (!string.IsNullOrWhiteSpace(raw))
        {
            if (TryParseJson(raw, out var p1, out var s1)) return (p1, s1);
            var m = Regex.Match(raw, @"\{[\s\S]*\}");
            if (m.Success && TryParseJson(m.Value, out var p2, out var s2)) return (p2, s2);
        }
        return ("Summary could not be generated.", "Neutral");
    }

    private static bool TryParseJson(string s, out string paragraph, out string sentiment)
    {
        paragraph = ""; sentiment = "";
        try
        {
            using var doc = JsonDocument.Parse(s);
            var root = doc.RootElement;
            if (root.ValueKind != JsonValueKind.Object) return false;
            var p = root.TryGetProperty("paragraph", out var pe) ? pe.GetString() ?? "" : "";
            var se = root.TryGetProperty("sentiment", out var sge) ? sge.GetString() ?? "" : "";
            if (string.IsNullOrWhiteSpace(p)) return false;
            if (se != "Warm" && se != "Neutral" && se != "Cool") se = "Neutral";
            paragraph = p; sentiment = se;
            return true;
        }
        catch { return false; }
    }
}
