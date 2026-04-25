// Covers bug: docs/bugs/interactions-list-endpoint-not-implemented.md
// Flow 12 — GET /api/contacts/{id}/interactions must list the contact's
// interactions for the All Activity timeline. Today the backend only
// has the POST handler at that path, so GET returns 405 and the SPA
// silently shows "No activity yet". This test hits the real endpoint.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;

namespace RecallQ.AcceptanceTests;

public class InteractionsListEndpointTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public InteractionsListEndpointTests(RecallqFactory factory) { _factory = factory; }

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
    public async Task Get_interactions_lists_paginated_rows_for_a_contact()
    {
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var meBody = await (await client.SendAsync(meReq)).Content.ReadFromJsonAsync<JsonElement>();
        var userId = meBody.GetProperty("id").GetGuid();

        // Seed a contact + 5 interactions directly via the DB so we
        // don't depend on POST behavior for setup.
        Guid contactId;
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            var contact = new Contact
            {
                OwnerUserId = userId,
                DisplayName = "Activity Subject",
                Initials = "AS",
            };
            db.Contacts.Add(contact);
            for (int i = 0; i < 5; i++)
            {
                db.Interactions.Add(new Interaction
                {
                    ContactId = contact.Id,
                    OwnerUserId = userId,
                    Type = InteractionType.Note,
                    OccurredAt = DateTime.UtcNow.AddDays(-i),
                    Subject = $"Subject {i}",
                    Content = $"Body {i}",
                });
            }
            await db.SaveChangesAsync();
            contactId = contact.Id;
        }

        // Hit the real endpoint — no Playwright route mock.
        using var listReq = new HttpRequestMessage(HttpMethod.Get, $"/api/contacts/{contactId}/interactions?page=1&pageSize=50");
        listReq.Headers.Add("Cookie", cookie);
        var listRes = await client.SendAsync(listReq);
        Assert.Equal(HttpStatusCode.OK, listRes.StatusCode);
        var body = await listRes.Content.ReadFromJsonAsync<JsonElement>();

        var items = body.GetProperty("items");
        Assert.Equal(JsonValueKind.Array, items.ValueKind);
        Assert.Equal(5, items.GetArrayLength());

        Assert.Equal(JsonValueKind.Null, body.GetProperty("nextPage").ValueKind);
    }
}
