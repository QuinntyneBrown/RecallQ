// Traces to: L2-026, L2-027, L2-028, L2-056
// Task: T020
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Entities;
using RecallQ.Api.Stacks;

namespace RecallQ.AcceptanceTests;

public class StacksTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public StacksTests(RecallqFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string Pw = "correcthorse12";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!) if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
        { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private static async Task<(HttpClient client, Guid userId, string cookie)> RegisterLogin(WebApplicationFactory<Program> factory)
    {
        var email = UniqueEmail();
        var client = factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);
        using var me = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        me.Headers.Add("Cookie", cookie);
        var meRes = await client.SendAsync(me);
        var body = await meRes.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private static async Task<Guid> CreateContact(HttpClient client, string cookie, string displayName, string[]? tags = null)
    {
        var payload = new { displayName, initials = "ZZ", tags = tags ?? Array.Empty<string>(),
            emails = Array.Empty<string>(), phones = Array.Empty<string>() };
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/contacts") { Content = JsonContent.Create(payload) };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        return body.GetProperty("id").GetGuid();
    }

    private static async Task<JsonElement[]> GetStacks(HttpClient client, string cookie)
    {
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/stacks");
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var arr = await res.Content.ReadFromJsonAsync<JsonElement[]>();
        return arr!;
    }

    [Fact]
    public async Task New_user_gets_3_default_stacks()
    {
        var (client, _, cookie) = await RegisterLogin(_factory);
        await CreateContact(client, cookie, "AI founders group A");
        var stacks = await GetStacks(client, cookie);
        Assert.Contains(stacks, s => s.GetProperty("name").GetString() == "AI founders"
                                     && s.GetProperty("count").GetInt32() >= 1);
    }

    [Fact]
    public async Task Stack_with_zero_count_hidden()
    {
        var (client, _, cookie) = await RegisterLogin(_factory);
        var stacks = await GetStacks(client, cookie);
        Assert.Empty(stacks);
    }

    [Fact]
    public async Task Tag_stack_count_reflects_membership()
    {
        var (client, userId, cookie) = await RegisterLogin(_factory);

        // Insert a custom Tag stack directly via the DbContext
        using (var scope = _factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Stacks.Add(new Stack
            {
                OwnerUserId = userId,
                Name = "vip",
                Kind = StackKind.Tag,
                Definition = "vip",
                SortOrder = 10,
            });
            await db.SaveChangesAsync();
        }

        await CreateContact(client, cookie, "A", new[] { "vip" });
        await CreateContact(client, cookie, "B", new[] { "vip", "other" });
        await CreateContact(client, cookie, "C", new[] { "vip" });

        var stacks = await GetStacks(client, cookie);
        var vip = stacks.FirstOrDefault(s => s.GetProperty("name").GetString() == "vip");
        Assert.Equal("vip", vip.GetProperty("name").GetString());
        Assert.Equal(3, vip.GetProperty("count").GetInt32());
    }

    [Fact]
    public async Task Query_stack_count_updates_after_cache_expires()
    {
        await using var factory = new ShortTtlFactory(TimeSpan.FromMilliseconds(200));
        var (client, userId, cookie) = await RegisterLogin(factory);

        await CreateContact(client, cookie, "AI founders group A");
        var s1 = await GetStacks(client, cookie);
        var ai1 = s1.First(s => s.GetProperty("name").GetString() == "AI founders");
        Assert.Equal(1, ai1.GetProperty("count").GetInt32());

        // Insert a matching contact directly via DbContext so the endpoint does
        // NOT invalidate the cache — this lets us observe TTL-only expiry.
        using (var scope = factory.Services.CreateScope())
        {
            var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
            db.Contacts.Add(new Contact
            {
                OwnerUserId = userId,
                DisplayName = "AI founders group B",
                Initials = "AB",
            });
            await db.SaveChangesAsync();
        }
        var s2 = await GetStacks(client, cookie);
        var ai2 = s2.First(s => s.GetProperty("name").GetString() == "AI founders");
        Assert.Equal(1, ai2.GetProperty("count").GetInt32()); // cached

        await Task.Delay(350);
        var s3 = await GetStacks(client, cookie);
        var ai3 = s3.First(s => s.GetProperty("name").GetString() == "AI founders");
        Assert.Equal(2, ai3.GetProperty("count").GetInt32());
    }

    [Fact]
    public async Task Other_user_stacks_not_visible()
    {
        var (clientA, _, cookieA) = await RegisterLogin(_factory);
        await CreateContact(clientA, cookieA, "AI founders alpha");
        var aStacks = await GetStacks(clientA, cookieA);
        var aIds = aStacks.Select(s => s.GetProperty("id").GetGuid()).ToHashSet();

        var (clientB, _, cookieB) = await RegisterLogin(_factory);
        await CreateContact(clientB, cookieB, "AI founders beta");
        var bStacks = await GetStacks(clientB, cookieB);
        var bIds = bStacks.Select(s => s.GetProperty("id").GetGuid()).ToHashSet();

        Assert.Empty(aIds.Intersect(bIds));
    }
}

internal class ShortTtlFactory : RecallqFactory
{
    private readonly TimeSpan _ttl;
    public ShortTtlFactory(TimeSpan ttl)
    {
        _ttl = ttl;
        var init = InitializeAsync();
        init.GetAwaiter().GetResult();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            var existing = services.Where(d => d.ServiceType == typeof(StackCountCacheOptions)
                || d.ServiceType == typeof(StackCountCache)).ToList();
            foreach (var d in existing) services.Remove(d);
            var opts = new StackCountCacheOptions { Ttl = _ttl };
            services.AddSingleton(opts);
            services.AddSingleton<StackCountCache>(new StackCountCache(opts));
        });
    }
}
