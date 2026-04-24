using Microsoft.AspNetCore.Authorization;
using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;
using RecallQ.Api.Stacks;

namespace RecallQ.Api.Endpoints;

public static class StacksEndpoints
{
    public record StackDto(Guid Id, string Name, string Kind, int Count);

    public static IEndpointRouteBuilder MapStacks(this IEndpointRouteBuilder app)
    {
        app.MapGet("/api/stacks", [Authorize] async (
            AppDbContext db, ICurrentUser current, StackCountCalculator calc,
            StackCountCache cache, CancellationToken ct) =>
        {
            var userId = current.UserId!.Value;
            var stacks = await db.Stacks.OrderBy(s => s.SortOrder).ToListAsync(ct);
            var list = new List<StackDto>();
            foreach (var s in stacks)
            {
                var key = (userId, s.Id);
                if (!cache.TryGet(key, out var count))
                {
                    count = await calc.CountAsync(s, ct);
                    cache.Set(key, count);
                }
                if (count > 0)
                    list.Add(new StackDto(s.Id, s.Name, s.Kind.ToString(), count));
            }
            return Results.Ok(list);
        });

        app.MapGet("/api/stacks/{id:guid}/contacts", [Authorize] async (
            Guid id, AppDbContext db, StackCountCalculator calc, CancellationToken ct) =>
        {
            var stack = await db.Stacks.FirstOrDefaultAsync(s => s.Id == id, ct);
            if (stack is null) return Results.NotFound();
            var query = calc.BuildMemberQuery(stack);
            query = stack.Kind == StackKind.Classification
                ? query.OrderByDescending(c => c.CreatedAt)
                : query.OrderByDescending(c => c.CreatedAt);
            var rows = await query.ToListAsync(ct);
            return Results.Ok(rows.Select(ContactsEndpoints.ContactDto.From).ToArray());
        });

        return app;
    }
}
