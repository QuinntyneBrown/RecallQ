using System.Security.Cryptography;
using System.Text;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Pgvector;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Embeddings;

public class EmbeddingWorker : BackgroundService
{
    private readonly ChannelReader<EmbeddingJob> _reader;
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly IEmbeddingClient _client;
    private readonly ILogger<EmbeddingWorker> _logger;

    public EmbeddingWorker(
        ChannelReader<EmbeddingJob> reader,
        IServiceScopeFactory scopeFactory,
        IEmbeddingClient client,
        ILogger<EmbeddingWorker> logger)
    {
        _reader = reader;
        _scopeFactory = scopeFactory;
        _client = client;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            await foreach (var job in _reader.ReadAllAsync(stoppingToken))
            {
                try
                {
                    await ProcessAsync(job, stoppingToken);
                }
                catch (OperationCanceledException) { throw; }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Unhandled error processing embedding job {JobId} kind={Kind}", job.Id, job.Kind);
                }
            }
        }
        catch (OperationCanceledException) { }
    }

    private async Task ProcessAsync(EmbeddingJob job, CancellationToken ct)
    {
        using var scope = _scopeFactory.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();

        string? sourceText = null;
        if (job.Kind == "contact")
        {
            var c = await db.Contacts.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == job.Id, ct);
            if (c is null) { _logger.LogWarning("Contact {Id} not found for embedding", job.Id); return; }
            sourceText = $"{c.DisplayName}\n{c.Role ?? ""} · {c.Organization ?? ""}\n{c.Location ?? ""}\nTags: {string.Join(", ", c.Tags)}\nEmails: {string.Join(", ", c.Emails)}";
        }
        else if (job.Kind == "interaction")
        {
            var i = await db.Interactions.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == job.Id, ct);
            if (i is null) { _logger.LogWarning("Interaction {Id} not found for embedding", job.Id); return; }
            var c = await db.Contacts.IgnoreQueryFilters().FirstOrDefaultAsync(x => x.Id == i.ContactId, ct);
            var name = c?.DisplayName ?? "";
            sourceText = $"{i.Type.ToString().ToLowerInvariant()} with {name}\nSubject: {i.Subject ?? ""}\nContent: {i.Content}";
        }
        else
        {
            _logger.LogWarning("Unknown embedding job kind {Kind}", job.Kind);
            return;
        }

        var contentHash = Convert.ToHexString(SHA256.HashData(Encoding.UTF8.GetBytes(sourceText))).ToLowerInvariant();

        if (job.Kind == "contact")
        {
            var existing = await db.ContactEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.ContactId == job.Id, ct);
            if (existing is not null && existing.ContentHash == contentHash && existing.Model == _client.Model && !existing.Failed)
            {
                _logger.LogDebug("Skipping contact {Id} (idempotent)", job.Id);
                return;
            }

            var attempts = existing?.Attempts ?? 0;
            float[]? vec = null;
            Exception? lastEx = null;
            var delays = new[] { 100, 400, 1600 };
            for (int attempt = 0; attempt < 3; attempt++)
            {
                attempts++;
                try
                {
                    vec = await _client.EmbedAsync(sourceText, ct);
                    lastEx = null;
                    break;
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    lastEx = ex;
                    if (attempt < 2) await Task.Delay(delays[attempt], ct);
                }
            }

            if (existing is null)
            {
                existing = new ContactEmbedding { ContactId = job.Id, OwnerUserId = job.OwnerUserId };
                db.ContactEmbeddings.Add(existing);
            }
            existing.OwnerUserId = job.OwnerUserId;
            existing.Model = _client.Model;
            existing.ContentHash = contentHash;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.Attempts = attempts;
            if (vec is not null)
            {
                existing.Embedding = new Vector(vec);
                existing.Failed = false;
                existing.LastError = null;
                _logger.LogInformation("embedded contact {Id} model={Model} hash={Hash}", job.Id, _client.Model, contentHash.Substring(0, 8));
            }
            else
            {
                existing.Failed = true;
                existing.LastError = lastEx?.Message;
                _logger.LogWarning("failed contact {Id} attempts={Attempts}", job.Id, attempts);
            }
            await db.SaveChangesAsync(ct);
        }
        else // interaction
        {
            var existing = await db.InteractionEmbeddings.IgnoreQueryFilters().FirstOrDefaultAsync(e => e.InteractionId == job.Id, ct);
            if (existing is not null && existing.ContentHash == contentHash && existing.Model == _client.Model && !existing.Failed)
            {
                _logger.LogDebug("Skipping interaction {Id} (idempotent)", job.Id);
                return;
            }

            var attempts = existing?.Attempts ?? 0;
            float[]? vec = null;
            Exception? lastEx = null;
            var delays = new[] { 100, 400, 1600 };
            for (int attempt = 0; attempt < 3; attempt++)
            {
                attempts++;
                try
                {
                    vec = await _client.EmbedAsync(sourceText, ct);
                    lastEx = null;
                    break;
                }
                catch (Exception ex) when (!ct.IsCancellationRequested)
                {
                    lastEx = ex;
                    if (attempt < 2) await Task.Delay(delays[attempt], ct);
                }
            }

            if (existing is null)
            {
                existing = new InteractionEmbedding { InteractionId = job.Id, OwnerUserId = job.OwnerUserId };
                db.InteractionEmbeddings.Add(existing);
            }
            existing.OwnerUserId = job.OwnerUserId;
            existing.Model = _client.Model;
            existing.ContentHash = contentHash;
            existing.UpdatedAt = DateTime.UtcNow;
            existing.Attempts = attempts;
            if (vec is not null)
            {
                existing.Embedding = new Vector(vec);
                existing.Failed = false;
                existing.LastError = null;
                _logger.LogInformation("embedded interaction {Id} model={Model} hash={Hash}", job.Id, _client.Model, contentHash.Substring(0, 8));
            }
            else
            {
                existing.Failed = true;
                existing.LastError = lastEx?.Message;
                _logger.LogWarning("failed interaction {Id} attempts={Attempts}", job.Id, attempts);
            }
            await db.SaveChangesAsync(ct);
        }
    }
}
