using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.RateLimiting;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Chat;

namespace RecallQ.Api.Endpoints;

public static class IntroDraftsEndpoints
{
    public record IntroDraftRequest(Guid ContactAId, Guid ContactBId);

    public static IEndpointRouteBuilder MapIntroDrafts(this IEndpointRouteBuilder app)
    {
        app.MapPost("/api/intro-drafts", [Authorize] async (
            IntroDraftRequest req, AppDbContext db, IntroDraftGenerator gen, CancellationToken ct) =>
        {
            if (req.ContactAId == Guid.Empty || req.ContactBId == Guid.Empty) return Results.BadRequest();
            if (req.ContactAId == req.ContactBId) return Results.BadRequest();
            var a = await db.Contacts.FirstOrDefaultAsync(x => x.Id == req.ContactAId, ct);
            if (a is null) return Results.NotFound();
            var b = await db.Contacts.FirstOrDefaultAsync(x => x.Id == req.ContactBId, ct);
            if (b is null) return Results.NotFound();
            var (subject, body) = await gen.GenerateAsync(a, b, ct);
            return Results.Ok(new { subject, body });
        }).RequireRateLimiting("intro");
        return app;
    }
}
