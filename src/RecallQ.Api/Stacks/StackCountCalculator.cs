using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Stacks;

public class StackCountCalculator
{
    private readonly AppDbContext _db;

    public StackCountCalculator(AppDbContext db)
    {
        _db = db;
    }

    public static readonly TimeSpan IntrosOwedAge = TimeSpan.FromDays(14);

    public Task<int> CountAsync(Stack s, CancellationToken ct) => s.Kind switch
    {
        StackKind.Tag => _db.Contacts.CountAsync(c => c.Tags.Contains(s.Definition), ct),
        StackKind.Classification => CountClassificationAsync(s.Definition, ct),
        StackKind.Query => CountQueryAsync(s.Definition, ct),
        _ => Task.FromResult(0),
    };

    public IQueryable<Contact> BuildMemberQuery(Stack s) => s.Kind switch
    {
        StackKind.Tag => _db.Contacts.Where(c => c.Tags.Contains(s.Definition)),
        StackKind.Classification => BuildClassificationQuery(s.Definition),
        StackKind.Query => BuildQueryTokenQuery(s.Definition),
        _ => _db.Contacts.Where(_ => false),
    };

    internal static string[] Tokenize(string definition) =>
        (definition ?? string.Empty)
            .Split(new[] { ' ', '\t', '\n', '\r' }, StringSplitOptions.RemoveEmptyEntries)
            .Select(t => t.ToLowerInvariant())
            .Where(t => t.Length >= 3)
            .Distinct()
            .ToArray();

    private Task<int> CountQueryAsync(string definition, CancellationToken ct)
    {
        var tokens = Tokenize(definition);
        if (tokens.Length == 0) return Task.FromResult(0);
        return BuildQueryTokenQuery(definition).CountAsync(ct);
    }

    private IQueryable<Contact> BuildQueryTokenQuery(string definition)
    {
        var tokens = Tokenize(definition);
        if (tokens.Length == 0) return _db.Contacts.Where(_ => false);
        // match any token in lowercased displayName OR any tag
        return _db.Contacts.Where(c =>
            tokens.Any(t => c.DisplayName.ToLower().Contains(t))
            || c.Tags.Any(tag => tokens.Any(t => tag.ToLower().Contains(t))));
    }

    private async Task<int> CountClassificationAsync(string id, CancellationToken ct)
    {
        if (id != "intros_owed") return 0;
        return await BuildClassificationQuery(id).CountAsync(ct);
    }

    private IQueryable<Contact> BuildClassificationQuery(string id)
    {
        if (id != "intros_owed") return _db.Contacts.Where(_ => false);
        var cutoff = DateTime.UtcNow - IntrosOwedAge;
        // contacts whose latest interaction is an Email and older than 14 days
        return from c in _db.Contacts
               let last = _db.Interactions
                   .Where(i => i.ContactId == c.Id)
                   .OrderByDescending(i => i.OccurredAt)
                   .FirstOrDefault()
               where last != null && last.Type == InteractionType.Email && last.OccurredAt < cutoff
               select c;
    }
}
