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
            Guid id, AppDbContext db, StackCountCalculator calc,
            int? page, int? pageSize, CancellationToken ct) =>
        {
            var stack = await db.Stacks.FirstOrDefaultAsync(s => s.Id == id, ct);
            if (stack is null) return Results.NotFound();
            var p = page is null or < 1 ? 1 : page.Value;
            var ps = pageSize is null or < 1 ? 50 : Math.Min(pageSize.Value, 100);
            var query = calc.BuildMemberQuery(stack).OrderByDescending(c => c.CreatedAt);
            var totalCount = await query.CountAsync(ct);
            var rows = await query.Skip((p - 1) * ps).Take(ps).ToListAsync(ct);
            var items = rows.Select(ContactsEndpoints.ContactDto.From).ToArray();
            var nextPage = totalCount > p * ps ? p + 1 : (int?)null;
            return Results.Ok(new { items, totalCount, page = p, pageSize = ps, nextPage });
        });

        return app;
    }
}
