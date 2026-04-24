// Traces to: L2-029, L2-030
// Task: T021
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;
using RecallQ.Api.Suggestions;

namespace RecallQ.AcceptanceTests;

public class SuggestionsTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public SuggestionsTests(RecallqFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string Pw = "correcthorse12";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterLogin()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var me = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        me.Headers.Add("Cookie", cookie);
        var meRes = await client.SendAsync(me);
        var body = await meRes.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private async Task<JsonElement?> GetSuggestion(HttpClient client, string cookie)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/suggestions");
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var raw = await res.Content.ReadAsStringAsync();
        if (string.IsNullOrWhiteSpace(raw) || raw == "null") return null;
        var el = JsonSerializer.Deserialize<JsonElement>(raw);
        if (el.ValueKind == JsonValueKind.Null) return null;
        return el;
    }

    [Fact]
    public async Task Detector_emits_meet_N_when_threshold_met()
    {
        var (client, userId, cookie) = await RegisterLogin();

        // Seed 3 contacts with tag "ai founders" + Meeting interactions ~2d ago, via DbContext.
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            for (int i = 0; i < 3; i++)
            {
                var c = new Contact
                {
                    OwnerUserId = userId,
                    DisplayName = $"AIF {i}",
                    Initials = "AI",
                    Tags = new[] { "ai founders" },
                };
                db.Contacts.Add(c);
                db.Interactions.Add(new Interaction
                {
                    ContactId = c.Id, OwnerUserId = userId,
                    Type = InteractionType.Meeting,
                    OccurredAt = DateTime.UtcNow.AddDays(-2),
                    Content = "met",
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
                .FirstOrDefaultAsync(s => s.OwnerUserId == userId && s.Kind == "meet_n_tag");
            Assert.NotNull(row);
            Assert.Contains("ai founders", row!.Key);
        }
    }

    [Fact]
    public async Task No_signal_yields_no_suggestion_home_hides_card()
    {
        var (client, userId, cookie) = await RegisterLogin();
        using (var scope = _factory.Services.CreateScope())
        {
            var det = scope.ServiceProvider.GetRequiredService<SuggestionDetector>();
            await det.DetectOnceAsync(userId, default);
        }
        var body = await GetSuggestion(client, cookie);
        Assert.Null(body);
    }

    [Fact]
    public async Task Dismiss_suppresses_same_key_for_7_days()
    {
        var (client, userId, cookie) = await RegisterLogin();
        // Insert a Suggestion directly
        Guid sugId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var s = new Suggestion
            {
                OwnerUserId = userId, Key = "meet-3-ai founders", Kind = "meet_n_tag",
                Title = "t", Body = "b", ActionLabel = "go", ActionHref = "/search?q=ai",
            };
            db.Suggestions.Add(s);
            await db.SaveChangesAsync();
            sugId = s.Id;
        }

        var pre = await GetSuggestion(client, cookie);
        Assert.NotNull(pre);

        using var dismiss = new HttpRequestMessage(HttpMethod.Post, "/api/suggestions/meet-3-ai%20founders/dismiss");
        dismiss.Headers.Add("Cookie", cookie);
        var dres = await client.SendAsync(dismiss);
        Assert.Equal(HttpStatusCode.NoContent, dres.StatusCode);

        var post = await GetSuggestion(client, cookie);
        Assert.Null(post);

        // Set DismissedAt to 6 days ago: still suppressed
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.Suggestions.IgnoreQueryFilters().FirstAsync(x => x.Id == sugId);
            row.DismissedAt = DateTime.UtcNow.AddDays(-6);
            await db.SaveChangesAsync();
        }
        Assert.Null(await GetSuggestion(client, cookie));

        // Set DismissedAt to 8 days ago: visible again
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var row = await db.Suggestions.IgnoreQueryFilters().FirstAsync(x => x.Id == sugId);
            row.DismissedAt = DateTime.UtcNow.AddDays(-8);
            await db.SaveChangesAsync();
        }
        Assert.NotNull(await GetSuggestion(client, cookie));
    }

    [Fact]
    public async Task Different_key_still_eligible_after_dismiss()
    {
        var (client, userId, cookie) = await RegisterLogin();
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Suggestions.Add(new Suggestion
            {
                OwnerUserId = userId, Key = "keyA", Kind = "meet_n_tag",
                Title = "t", Body = "A", ActionLabel = "go", ActionHref = "/a",
                DismissedAt = DateTime.UtcNow,
            });
            db.Suggestions.Add(new Suggestion
            {
                OwnerUserId = userId, Key = "keyB", Kind = "owed_replies",
                Title = "t", Body = "B", ActionLabel = "go", ActionHref = "/b",
                CreatedAt = DateTime.UtcNow.AddSeconds(1),
            });
            await db.SaveChangesAsync();
        }
        var body = await GetSuggestion(client, cookie);
        Assert.NotNull(body);
        Assert.Equal("keyB", body!.Value.GetProperty("key").GetString());
    }
}
