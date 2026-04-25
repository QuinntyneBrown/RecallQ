// Covers bug: docs/bugs/import-does-not-invalidate-stack-count-cache.md
// Flow 31 — bulk import must invalidate the per-owner stack count
// cache so /home reflects the new contacts. ContactsEndpoints does
// this on single-create; the import endpoint forgot.
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;

namespace RecallQ.AcceptanceTests;

public class ImportInvalidatesStackCacheTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public ImportInvalidatesStackCacheTests(RecallqFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private static MultipartFormDataContent Form(byte[] bytes)
    {
        var content = new MultipartFormDataContent();
        var file = new ByteArrayContent(bytes);
        file.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        content.Add(file, "file", "contacts.csv");
        return content;
    }

    [Fact]
    public async Task Import_invalidates_the_per_owner_stack_cache()
    {
        // Register + login.
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var me = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        me.Headers.Add("Cookie", cookie);
        var meBody = await (await client.SendAsync(me)).Content.ReadFromJsonAsync<JsonElement>();
        var userId = meBody.GetProperty("id").GetGuid();

        // Seed one contact tagged "ai founders" so the stack has a baseline count.
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Contacts.Add(new Contact
            {
                OwnerUserId = userId,
                DisplayName = "Initial AIF",
                Initials = "IA",
                Tags = new[] { "ai founders" },
            });
            await db.SaveChangesAsync();
        }

        // Prime the stacks cache via GET /api/stacks. The "AI founders"
        // stack should report a count of 1.
        async Task<int> AiFoundersCount()
        {
            using var req = new HttpRequestMessage(HttpMethod.Get, "/api/stacks");
            req.Headers.Add("Cookie", cookie);
            var res = await client.SendAsync(req);
            Assert.Equal(HttpStatusCode.OK, res.StatusCode);
            var arr = await res.Content.ReadFromJsonAsync<JsonElement>();
            foreach (var s in arr.EnumerateArray())
            {
                if (string.Equals(s.GetProperty("name").GetString(), "AI founders", StringComparison.OrdinalIgnoreCase))
                    return s.GetProperty("count").GetInt32();
            }
            return 0;
        }

        var before = await AiFoundersCount();
        Assert.Equal(1, before);

        // Bulk import three more contacts tagged "ai founders". The
        // import endpoint must invalidate the cache so the next GET
        // recomputes against the new dataset.
        var csv = Encoding.UTF8.GetBytes(
            "displayName,role,organization,emails,phones,tags,location\n" +
            "Imp 1,,,,,ai founders,\n" +
            "Imp 2,,,,,ai founders,\n" +
            "Imp 3,,,,,ai founders,\n");
        using var importReq = new HttpRequestMessage(HttpMethod.Post, "/api/import/contacts") { Content = Form(csv) };
        importReq.Headers.Add("Cookie", cookie);
        var importRes = await client.SendAsync(importReq);
        Assert.Equal(HttpStatusCode.Created, importRes.StatusCode);
        var importBody = await importRes.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(3, importBody.GetProperty("imported").GetInt32());

        var after = await AiFoundersCount();
        Assert.Equal(4, after);
    }
}
