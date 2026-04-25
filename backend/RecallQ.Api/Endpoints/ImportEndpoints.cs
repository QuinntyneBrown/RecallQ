using System.Threading.Channels;
using CsvHelper;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;
using RecallQ.Api.Stacks;

namespace RecallQ.Api.Endpoints;

public static class ImportEndpoints
{
    public const long MaxBytes = 10_000_000;

    public static IEndpointRouteBuilder MapImport(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/import/contacts", [Authorize] async (
            HttpRequest request, AppDbContext db, ICurrentUser current,
            ChannelWriter<EmbeddingJob> embeddingWriter,
            StackCountCache stackCache) =>
        {
            if (request.ContentLength > MaxBytes) return Results.StatusCode(413);
            if (!request.HasFormContentType) return Results.BadRequest(new { error = "multipart required" });
            var form = await request.ReadFormAsync();
            var file = form.Files["file"] ?? form.Files.FirstOrDefault();
            if (file is null) return Results.BadRequest(new { error = "file field required" });
            if (file.Length > MaxBytes) return Results.StatusCode(413);

            var errors = new List<object>();
            var batch = new List<Contact>(ImportContactsHelper.BatchSize);
            var created = new List<Guid>();
            int imported = 0, failed = 0;
            var ownerId = current.UserId!.Value;

            await using var stream = file.OpenReadStream();
            using var reader = new StreamReader(stream);
            using var csv = new CsvReader(reader, ImportContactsHelper.CsvConfig());
            csv.Context.RegisterClassMap<ImportContactRowMap>();
            await csv.ReadAsync(); csv.ReadHeader();

            async Task FlushAsync()
            {
                if (batch.Count == 0) return;
                db.Contacts.AddRange(batch);
                await db.SaveChangesAsync();
                foreach (var c in batch) created.Add(c.Id);
                imported += batch.Count;
                batch.Clear();
            }

            while (await csv.ReadAsync())
            {
                var rawRow = csv.Parser.RawRecord ?? string.Empty;
                var rowIndex = csv.Parser.Row - 1;
                if (rawRow.Length > ImportContactsHelper.MaxRowLength)
                { failed++; errors.Add(new { row = rowIndex, reason = $"row exceeds {ImportContactsHelper.MaxRowLength} chars" }); continue; }
                ImportContactRow parsed;
                try { parsed = csv.GetRecord<ImportContactRow>()!; }
                catch (Exception ex) { failed++; errors.Add(new { row = rowIndex, reason = ex.Message }); continue; }
                if (!ImportContactsHelper.TryBuildContact(parsed, ownerId, out var contact, out var reason))
                { failed++; errors.Add(new { row = rowIndex, reason = reason! }); continue; }
                batch.Add(contact!);
                if (batch.Count >= ImportContactsHelper.BatchSize) await FlushAsync();
            }
            await FlushAsync();
            if (imported > 0) stackCache.InvalidateOwner(ownerId);
            foreach (var id in created)
                await embeddingWriter.WriteAsync(new EmbeddingJob(id, ownerId, "contact"));
            return Results.Json(new { imported, failed, errors }, statusCode: StatusCodes.Status201Created);
        }).DisableAntiforgery();
        return app;
    }
}
