// Covers bug: docs/bugs/manual-summary-refresh-result-not-visible-until-revisit.md
// Flow 27 — after a manual refresh, GET /summary must report "pending"
// until the worker has caught up (UpdatedAt >= LastRefreshRequestedAt).
// Otherwise the SPA stops polling on the first reply and never sees
// the regenerated paragraph land in the same session.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;

namespace RecallQ.AcceptanceTests;

public class SummaryRefreshGatedOnLastRequestTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public SummaryRefreshGatedOnLastRequestTests(RecallqFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    [Fact]
    public async Task Get_summary_reports_pending_after_manual_refresh_until_worker_writes()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);

        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await (await client.SendAsync(meReq)).Content.ReadFromJsonAsync<JsonElement>();
        var userId = me.GetProperty("id").GetGuid();

        Guid contactId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var contact = new Contact
            {
                OwnerUserId = userId,
                DisplayName = "Refresh Subject",
                Initials = "RS",
            };
            db.Contacts.Add(contact);
            db.Interactions.Add(new Interaction
            {
                ContactId = contact.Id,
                OwnerUserId = userId,
                Type = InteractionType.Note,
                OccurredAt = DateTime.UtcNow.AddDays(-1),
                Content = "first interaction",
            });
            // Pre-existing summary that's already 30 minutes old — within the
            // worker's 1h idempotency guard, so the regeneration would
            // normally be skipped. The bug's symptom is that GET reports
            // "ready" with this paragraph immediately on the first poll.
            db.RelationshipSummaries.Add(new RelationshipSummary
            {
                ContactId = contact.Id,
                OwnerUserId = userId,
                Paragraph = "OLD paragraph from before the refresh",
                Sentiment = "Warm",
                InteractionCount = 1,
                LastInteractionAt = DateTime.UtcNow.AddDays(-1),
                UpdatedAt = DateTime.UtcNow.AddMinutes(-30),
                LastRefreshRequestedAt = null,
                Model = "fake",
                SourceHash = "OLDHASH",
            });
            await db.SaveChangesAsync();
            contactId = contact.Id;
        }

        // Sanity: GET initially returns "ready" with the pre-existing paragraph.
        using (var pre = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{contactId}/summary"))
        {
            pre.Headers.Add("Cookie", cookie);
            var preRes = await client.SendAsync(pre);
            Assert.Equal(HttpStatusCode.OK, preRes.StatusCode);
            var preJson = await preRes.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("ready", preJson.GetProperty("status").GetString());
            Assert.Equal("OLD paragraph from before the refresh", preJson.GetProperty("paragraph").GetString());
        }

        // Manually refresh — sets LastRefreshRequestedAt = now, enqueues a
        // SummaryRefreshJob. Worker is NOT running in this fixture, so the
        // job sits in the channel; UpdatedAt stays at 30 min ago.
        using (var post = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{contactId}/summary:refresh"))
        {
            post.Headers.Add("Cookie", cookie);
            var postRes = await client.SendAsync(post);
            Assert.Equal(HttpStatusCode.Accepted, postRes.StatusCode);
        }

        // Now GET /summary must report pending — LastRefreshRequestedAt is
        // newer than UpdatedAt, so the worker hasn't caught up yet. The
        // SPA must keep polling; it can't terminate on a "ready" with the
        // stale paragraph the way it does today.
        using (var post = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{contactId}/summary"))
        {
            post.Headers.Add("Cookie", cookie);
            var postRes = await client.SendAsync(post);
            Assert.Equal(HttpStatusCode.OK, postRes.StatusCode);
            var postJson = await postRes.Content.ReadFromJsonAsync<JsonElement>();
            Assert.Equal("pending", postJson.GetProperty("status").GetString());
        }
    }
}
