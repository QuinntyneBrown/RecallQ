using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Suggestions;

public class SuggestionDetectorOptions
{
    public TimeSpan Interval { get; set; } = TimeSpan.FromHours(1);
}

public class SuggestionDetectorHostedService : BackgroundService
{
    private readonly SuggestionDetector _detector;
    public SuggestionDetectorHostedService(SuggestionDetector detector) { _detector = detector; }
    protected override Task ExecuteAsync(CancellationToken stoppingToken) => _detector.RunLoopAsync(stoppingToken);
}

public class SuggestionDetector
{
    private readonly IServiceScopeFactory _scopes;
    private readonly SuggestionDetectorOptions _options;
    private readonly ILogger<SuggestionDetector> _logger;

    public SuggestionDetector(IServiceScopeFactory scopes, SuggestionDetectorOptions options, ILogger<SuggestionDetector> logger)
    {
        _scopes = scopes;
        _options = options;
        _logger = logger;
    }

    public async Task RunLoopAsync(CancellationToken stoppingToken)
    {
        while (!stoppingToken.IsCancellationRequested)
        {
            try
            {
                await TickAsync(stoppingToken);
            }
            catch (OperationCanceledException) { }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "SuggestionDetector tick failed.");
            }
            try { await Task.Delay(_options.Interval, stoppingToken); }
            catch (OperationCanceledException) { break; }
        }
    }

    private async Task TickAsync(CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var ownerIds = await db.Users.Select(u => u.Id).ToListAsync(ct);
        foreach (var id in ownerIds)
        {
            await DetectOnceAsync(id, ct);
        }
    }

    public async Task DetectOnceAsync(Guid ownerUserId, CancellationToken ct)
    {
        using var scope = _scopes.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        var now = DateTime.UtcNow;
        var since14 = now.AddDays(-14);
        var since30 = now.AddDays(-30);

        // Load contacts owned by user (ignore filter since we set current user above,
        // but be explicit with IgnoreQueryFilters + owner filter for safety).
        var contacts = await db.Contacts.IgnoreQueryFilters()
            .Where(c => c.OwnerUserId == ownerUserId).ToListAsync(ct);
        var contactIds = contacts.Select(c => c.Id).ToHashSet();
        var recentInteractions = await db.Interactions.IgnoreQueryFilters()
            .Where(i => i.OwnerUserId == ownerUserId && i.OccurredAt >= since30)
            .ToListAsync(ct);

        var emitted = 0;

        // meet_n_tag: tag with >=3 contacts interacted with in the last 14d
        var last14ContactIds = recentInteractions
            .Where(i => i.OccurredAt >= since14)
            .Select(i => i.ContactId).ToHashSet();
        var tagCounts = contacts
            .Where(c => last14ContactIds.Contains(c.Id))
            .SelectMany(c => (c.Tags ?? Array.Empty<string>()).Select(t => (t, c.Id)))
            .GroupBy(x => x.t)
            .Select(g => new { Tag = g.Key, Count = g.Select(x => x.Id).Distinct().Count() })
            .Where(x => x.Count >= 3)
            .OrderByDescending(x => x.Count).ThenBy(x => x.Tag)
            .ToList();
        if (tagCounts.Count > 0)
        {
            var top = tagCounts[0];
            var key = $"meet-{top.Count}-{top.Tag}";
            if (!await db.Suggestions.IgnoreQueryFilters()
                .AnyAsync(s => s.OwnerUserId == ownerUserId && s.Key == key, ct))
            {
                db.Suggestions.Add(new Suggestion
                {
                    OwnerUserId = ownerUserId,
                    Key = key,
                    Kind = "meet_n_tag",
                    Title = $"You met {top.Count} {top.Tag}",
                    Body = $"You met {top.Count} {top.Tag} last week — shall I find similar investors?",
                    ActionLabel = $"Find similar {top.Tag}",
                    ActionHref = $"/search?q={Uri.EscapeDataString(top.Tag)}",
                });
                emitted++;
            }
        }

        // owed_replies: contacts whose most-recent interaction is Email older than 7d
        var since7 = now.AddDays(-7);
        var latestByContact = recentInteractions
            .GroupBy(i => i.ContactId)
            .Select(g => g.OrderByDescending(x => x.OccurredAt).First())
            .ToList();
        var owed = latestByContact.Count(l => l.Type == InteractionType.Email && l.OccurredAt < since7);
        if (owed >= 2)
        {
            var key = $"owed-replies-{owed}";
            if (!await db.Suggestions.IgnoreQueryFilters()
                .AnyAsync(s => s.OwnerUserId == ownerUserId && s.Key == key, ct))
            {
                db.Suggestions.Add(new Suggestion
                {
                    OwnerUserId = ownerUserId,
                    Key = key,
                    Kind = "owed_replies",
                    Title = $"{owed} possible unreplied emails",
                    Body = $"You have {owed} possible unreplied emails — want to triage them?",
                    ActionLabel = "Triage",
                    ActionHref = "/search?sort=recent",
                });
                emitted++;
            }
        }

        // silent_warm: warm relationship, last interaction older than 30d
        var warmStale = await db.RelationshipSummaries.IgnoreQueryFilters()
            .Where(r => r.OwnerUserId == ownerUserId && r.Sentiment == "Warm"
                 && r.LastInteractionAt != null && r.LastInteractionAt < now.AddDays(-30))
            .ToListAsync(ct);
        foreach (var rs in warmStale)
        {
            var contact = contacts.FirstOrDefault(c => c.Id == rs.ContactId);
            if (contact is null) continue;
            var key = $"silent-warm-{rs.ContactId}";
            if (await db.Suggestions.IgnoreQueryFilters()
                .AnyAsync(s => s.OwnerUserId == ownerUserId && s.Key == key, ct)) continue;
            db.Suggestions.Add(new Suggestion
            {
                OwnerUserId = ownerUserId,
                Key = key,
                Kind = "silent_warm",
                Title = "Gone quiet",
                Body = $"You've gone quiet with {contact.DisplayName} — worth a check-in?",
                ActionLabel = "Open contact",
                ActionHref = $"/contacts/{rs.ContactId}",
            });
            emitted++;
        }

        if (emitted > 0) await db.SaveChangesAsync(ct);
        _logger.LogInformation("SuggestionDetector emitted {Count} suggestions.", emitted);
    }
}
