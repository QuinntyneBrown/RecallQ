using System.Collections.Concurrent;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Embeddings;

public class EmbeddingBackfillRunner
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ChannelWriter<EmbeddingJob> _writer;
    private readonly ILogger<EmbeddingBackfillRunner> _logger;
    private readonly ConcurrentDictionary<Guid, byte> _running = new();
    private const int ChunkSize = 500;

    public EmbeddingBackfillRunner(
        IServiceScopeFactory scopeFactory,
        ChannelWriter<EmbeddingJob> writer,
        ILogger<EmbeddingBackfillRunner> logger)
    {
        _scopeFactory = scopeFactory;
        _writer = writer;
        _logger = logger;
    }

    public void StartInBackground(Guid ownerUserId)
    {
        if (!_running.TryAdd(ownerUserId, 0)) return;
        _ = Task.Run(async () =>
        {
            try { await RunAsync(ownerUserId, CancellationToken.None); }
            catch (Exception ex) { _logger.LogError(ex, "backfill failed owner={Owner}", ownerUserId); }
            finally { _running.TryRemove(ownerUserId, out _); }
        });
    }

    public async Task RunAsync(Guid ownerUserId, CancellationToken ct)
    {
        await ProcessTableAsync(ownerUserId, "contacts", ct);
        await ProcessTableAsync(ownerUserId, "interactions", ct);
        _logger.LogInformation("backfill complete owner={Owner}", ownerUserId);
    }

    private async Task ProcessTableAsync(Guid ownerUserId, string table, CancellationToken ct)
    {
        while (!ct.IsCancellationRequested)
        {
            using var scope = _scopeFactory.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var cursor = await db.BackfillCursors.FirstOrDefaultAsync(x => x.OwnerUserId == ownerUserId && x.Table == table, ct);
            if (cursor is null)
            {
                cursor = new BackfillCursor { OwnerUserId = ownerUserId, Table = table, StartedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow };
                db.BackfillCursors.Add(cursor);
                await db.SaveChangesAsync(ct);
            }
            else if (cursor.Completed)
            {
                cursor.LastProcessedCreatedAt = default;
                cursor.LastProcessedId = default;
                cursor.Completed = false;
                cursor.StartedAt = DateTime.UtcNow;
                cursor.UpdatedAt = DateTime.UtcNow;
                await db.SaveChangesAsync(ct);
                _logger.LogInformation("backfill cursor reset owner={Owner} table={Table} (was completed)", ownerUserId, table);
            }

            int count = 0;
            if (table == "contacts")
            {
                var rows = await db.Contacts.IgnoreQueryFilters()
                    .Where(c => c.OwnerUserId == ownerUserId &&
                        (c.CreatedAt > cursor.LastProcessedCreatedAt ||
                        (c.CreatedAt == cursor.LastProcessedCreatedAt && c.Id.CompareTo(cursor.LastProcessedId) > 0)))
                    .OrderBy(c => c.CreatedAt).ThenBy(c => c.Id)
                    .Take(ChunkSize)
                    .Select(c => new { c.Id, c.CreatedAt })
                    .ToListAsync(ct);
                count = rows.Count;
                foreach (var r in rows)
                {
                    await _writer.WriteAsync(new EmbeddingJob(r.Id, ownerUserId, "contact"), ct);
                    cursor.LastProcessedCreatedAt = r.CreatedAt;
                    cursor.LastProcessedId = r.Id;
                }
            }
            else
            {
                var rows = await db.Interactions.IgnoreQueryFilters()
                    .Where(i => i.OwnerUserId == ownerUserId &&
                        (i.CreatedAt > cursor.LastProcessedCreatedAt ||
                        (i.CreatedAt == cursor.LastProcessedCreatedAt && i.Id.CompareTo(cursor.LastProcessedId) > 0)))
                    .OrderBy(i => i.CreatedAt).ThenBy(i => i.Id)
                    .Take(ChunkSize)
                    .Select(i => new { i.Id, i.CreatedAt })
                    .ToListAsync(ct);
                count = rows.Count;
                foreach (var r in rows)
                {
                    await _writer.WriteAsync(new EmbeddingJob(r.Id, ownerUserId, "interaction"), ct);
                    cursor.LastProcessedCreatedAt = r.CreatedAt;
                    cursor.LastProcessedId = r.Id;
                }
            }

            cursor.UpdatedAt = DateTime.UtcNow;
            if (count < ChunkSize) cursor.Completed = true;
            await db.SaveChangesAsync(ct);
            _logger.LogInformation("backfill chunk owner={Owner} table={Table} count={Count} completed={Done}", ownerUserId, table, count, cursor.Completed);
            if (cursor.Completed) return;
        }
    }
}
