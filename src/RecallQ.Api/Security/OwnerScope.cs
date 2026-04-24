using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Security;

public static class OwnerScope
{
    // Registers owner-scoped HasQueryFilter on every owned entity. The DbContext instance
    // exposes the current user via its ICurrentUser field; EF Core parameterizes the
    // member-access expression per DbContext so filters stay per-request-correct.
    public static void ConfigureOwnerScope(ModelBuilder b, AppDbContext ctx)
    {
        b.Entity<Contact>().HasQueryFilter(c => c.OwnerUserId == ctx.CurrentUser.UserId);
        b.Entity<Interaction>().HasQueryFilter(i => i.OwnerUserId == ctx.CurrentUser.UserId);
        b.Entity<ContactEmbedding>().HasQueryFilter(e => e.OwnerUserId == ctx.CurrentUser.UserId);
        b.Entity<InteractionEmbedding>().HasQueryFilter(e => e.OwnerUserId == ctx.CurrentUser.UserId);
        b.Entity<RelationshipSummary>().HasQueryFilter(s => s.OwnerUserId == ctx.CurrentUser.UserId);
        b.Entity<Stack>().HasQueryFilter(s => s.OwnerUserId == ctx.CurrentUser.UserId);
        b.Entity<Suggestion>().HasQueryFilter(s => s.OwnerUserId == ctx.CurrentUser.UserId);
    }
}
