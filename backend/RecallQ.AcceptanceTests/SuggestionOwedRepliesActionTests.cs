// Covers bug: docs/bugs/suggestion-owed-replies-action-routes-nowhere.md
// Flow 25 — when SuggestionDetector emits an owed_replies suggestion,
// its actionHref must point at a route the SPA actually has. The
// previous "/contacts?filter=owed" hits the wildcard and bounces
// authenticated users to /login.
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;
using RecallQ.Api.Suggestions;

namespace RecallQ.AcceptanceTests;

public class SuggestionOwedRepliesActionTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public SuggestionOwedRepliesActionTests(RecallqFactory factory) { _factory = factory; }

    [Fact]
    public async Task Owed_replies_actionHref_must_not_route_to_login()
    {
        var userId = Guid.NewGuid();

        // Seed: a user, two contacts, each with an Email older than 7 days
        // so the detector's owed_replies branch fires.
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Users.Add(new User { Id = userId, Email = $"owed-{userId:N}@example.com", PasswordHash = "x" });
            for (int i = 0; i < 2; i++)
            {
                var c = new Contact
                {
                    OwnerUserId = userId,
                    DisplayName = $"OwedC {i}",
                    Initials = "OC",
                };
                db.Contacts.Add(c);
                db.Interactions.Add(new Interaction
                {
                    ContactId = c.Id,
                    OwnerUserId = userId,
                    Type = InteractionType.Email,
                    OccurredAt = DateTime.UtcNow.AddDays(-10),
                    Content = "old email",
                });
            }
            await db.SaveChangesAsync();
        }

        using (var scope = _factory.Services.CreateScope())
        {
            var det = scope.ServiceProvider.GetRequiredService<SuggestionDetector>();
            await det.DetectOnceAsync(userId, default);
        }

        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.Suggestions.IgnoreQueryFilters()
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId && s.Kind == "owed_replies");
            Assert.NotNull(row);

            // The SPA's app.routes.ts has no "/contacts" plain-list route,
            // so /contacts?filter=owed hits the wildcard and bounces to login.
            // Routes that exist (and any future contacts list) are fine.
            Assert.False(
                row!.ActionHref.StartsWith("/contacts?", StringComparison.Ordinal),
                $"owed_replies actionHref '{row.ActionHref}' starts with /contacts? — that route does not exist and the wildcard redirects authenticated users to /login.");

            // Stronger: must start with one of the known SPA routes.
            string[] knownPrefixes = { "/search", "/ask", "/home", "/import", "/contacts/" };
            Assert.Contains(knownPrefixes, p => row.ActionHref.StartsWith(p, StringComparison.Ordinal));
        }
    }
}
