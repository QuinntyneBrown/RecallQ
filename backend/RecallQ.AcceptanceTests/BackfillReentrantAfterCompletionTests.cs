// Covers bug: docs/bugs/embedding-backfill-stuck-after-cursor-completion.md
// Flow 33 — once a BackfillCursor's Completed flag is true, subsequent
// runs must reset and re-enumerate so a model upgrade (or any other
// scenario that leaves rows mis-modeled) can recover. Today the runner
// returns immediately on a completed cursor, leaving the user stuck.
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class BackfillReentrantAfterCompletionTests : IClassFixture<EmbeddingWorkerFactory>
{
    private readonly EmbeddingWorkerFactory _factory;
    public BackfillReentrantAfterCompletionTests(EmbeddingWorkerFactory factory) { _factory = factory; }

    [Fact]
    public async Task Backfill_re_enumerates_when_cursor_already_completed()
    {
        var ownerId = Guid.NewGuid();

        // Seed: a user, a contact created NOW, and a BackfillCursor that
        // claims it's already completed (LastProcessed pinned to the past).
        // No embedding row exists for the contact — exactly the state the
        // bug leaves users in after a model upgrade.
        Guid contactId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User { Id = ownerId, Email = $"bf-{ownerId:N}@example.com", PasswordHash = "x" });
            var contact = new Contact
            {
                OwnerUserId = ownerId,
                DisplayName = "Backfill Subject",
                Initials = "BS",
                CreatedAt = DateTime.UtcNow,
            };
            db.Contacts.Add(contact);
            contactId = contact.Id;

            db.BackfillCursors.Add(new BackfillCursor
            {
                OwnerUserId = ownerId,
                Table = "contacts",
                LastProcessedCreatedAt = DateTime.UtcNow.AddYears(-5),
                LastProcessedId = Guid.Empty,
                StartedAt = DateTime.UtcNow.AddYears(-5),
                UpdatedAt = DateTime.UtcNow.AddYears(-5),
                Completed = true,
            });
            db.BackfillCursors.Add(new BackfillCursor
            {
                OwnerUserId = ownerId,
                Table = "interactions",
                LastProcessedCreatedAt = DateTime.UtcNow.AddYears(-5),
                LastProcessedId = Guid.Empty,
                StartedAt = DateTime.UtcNow.AddYears(-5),
                UpdatedAt = DateTime.UtcNow.AddYears(-5),
                Completed = true,
            });
            await db.SaveChangesAsync();
        }

        // Run the backfill. The cursor is "completed", so the buggy
        // implementation returns immediately and the worker never sees
        // a job for our contact.
        using (var scope = _factory.Services.CreateScope())
        {
            var runner = scope.ServiceProvider.GetRequiredService<EmbeddingBackfillRunner>();
            await runner.RunAsync(ownerId, default);
        }

        // Wait briefly for the worker to drain anything that was enqueued.
        var deadline = DateTime.UtcNow.AddSeconds(10);
        ContactEmbedding? row = null;
        while (DateTime.UtcNow < deadline)
        {
            using var scope = _factory.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            row = await db.ContactEmbeddings.IgnoreQueryFilters()
                .FirstOrDefaultAsync(e => e.ContactId == contactId);
            if (row is not null) break;
            await Task.Delay(200);
        }

        // After the reset+re-enumerate fix, the worker has produced an
        // embedding row for the contact. Today this is null.
        Assert.NotNull(row);
    }
}
