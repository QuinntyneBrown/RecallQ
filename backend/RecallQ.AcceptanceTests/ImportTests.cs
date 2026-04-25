// Traces to: L2-077
// Task: T025
using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;

namespace RecallQ.AcceptanceTests;

public class ImportTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public ImportTests(RecallqFactory factory) { _factory = factory; }

    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";
    private const string GoodPassword = "correcthorse12";

    private static string ExtractAuthCookie(HttpResponseMessage response)
    {
        Assert.True(response.Headers.TryGetValues("Set-Cookie", out var cookies));
        foreach (var c in cookies!)
            if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
            {
                var semi = c.IndexOf(';');
                return semi > 0 ? c[..semi] : c;
            }
        throw new Xunit.Sdk.XunitException("rq_auth cookie not found");
    }

    private async Task<(HttpClient client, Guid userId, string cookie)> RegisterAndLogin(string email)
    {
        var client = _factory.CreateClient();
        var reg = await client.PostAsJsonAsync("/api/auth/register", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.Created, reg.StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = GoodPassword });
        Assert.Equal(HttpStatusCode.OK, login.StatusCode);
        var cookie = ExtractAuthCookie(login);
        using var meReq = new HttpRequestMessage(HttpMethod.Get, "/api/auth/me");
        meReq.Headers.Add("Cookie", cookie);
        var me = await client.SendAsync(meReq);
        var body = await me.Content.ReadFromJsonAsync<JsonElement>();
        return (client, body.GetProperty("id").GetGuid(), cookie);
    }

    private static MultipartFormDataContent BuildForm(byte[] bytes, string filename = "contacts.csv")
    {
        var form = new MultipartFormDataContent();
        var content = new ByteArrayContent(bytes);
        content.Headers.ContentType = new MediaTypeHeaderValue("text/csv");
        form.Add(content, "file", filename);
        return form;
    }

    [Fact]
    public async Task Import_row_with_more_than_10_emails_is_rejected()
    {
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var emails = string.Join(';', Enumerable.Range(0, 11).Select(i => $"user{i}@example.com"));
        var csv = "displayName,emails\n" + $"Too Many,\"{emails}\"\n";
        var bytes = Encoding.UTF8.GetBytes(csv);

        using var form = BuildForm(bytes);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/import/contacts") { Content = form };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(0, body.GetProperty("imported").GetInt32());
        Assert.Equal(1, body.GetProperty("failed").GetInt32());
        var errs = body.GetProperty("errors");
        Assert.Equal(1, errs.GetArrayLength());
        Assert.Contains("emails", errs[0].GetProperty("reason").GetString(), StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task Import_500_rows_creates_500_contacts_and_enqueues_embeddings()
    {
        _factory.CapturedJobs.Clear();
        var (client, userId, cookie) = await RegisterAndLogin(UniqueEmail());
        var sb = new StringBuilder();
        sb.AppendLine("displayName,role,organization,emails,phones,tags,location");
        for (int i = 0; i < 500; i++)
            sb.AppendLine($"User{i:D3},Role{i},OrgX,u{i}@example.com,+155500{i:D4},tag1;tag2,City");
        var bytes = Encoding.UTF8.GetBytes(sb.ToString());

        using var form = BuildForm(bytes);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/import/contacts") { Content = form };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(500, body.GetProperty("imported").GetInt32());
        Assert.Equal(0, body.GetProperty("failed").GetInt32());

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        var count = await db.Contacts.IgnoreQueryFilters().CountAsync(c => c.OwnerUserId == userId);
        Assert.Equal(500, count);

        var deadline = DateTime.UtcNow.AddSeconds(10);
        while (DateTime.UtcNow < deadline && _factory.CapturedJobs.Count(j => j.OwnerUserId == userId) < 500)
            await Task.Delay(50);
        Assert.Equal(500, _factory.CapturedJobs.Count(j => j.OwnerUserId == userId));
    }

    [Fact]
    public async Task Import_with_invalid_rows_reports_per_row_errors()
    {
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var csv =
            "displayName,role,organization,emails,phones,tags,location\n" +
            "Alice A,VP,Acme,a@x.com,+1,vc,SF\n" +
            "Bob B,Eng,Bob,b@x.com,+2,eng,LA\n" +
            ",MissingName,Foo,,,,\n" +
            "Carol C,PM,Cee,c@x.com,+3,pm,NY\n" +
            "Dana D,Des,Dee,d@x.com,+4,des,LDN\n";
        var bytes = Encoding.UTF8.GetBytes(csv);

        using var form = BuildForm(bytes);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/import/contacts") { Content = form };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.Created, res.StatusCode);
        var body = await res.Content.ReadFromJsonAsync<JsonElement>();
        Assert.Equal(4, body.GetProperty("imported").GetInt32());
        Assert.Equal(1, body.GetProperty("failed").GetInt32());
        var errs = body.GetProperty("errors");
        Assert.Equal(1, errs.GetArrayLength());
        var first = errs[0];
        Assert.Equal(3, first.GetProperty("row").GetInt32());
        Assert.Contains("displayName", first.GetProperty("reason").GetString());
    }

    [Fact]
    public async Task Import_over_10MB_returns_413()
    {
        var (client, _, cookie) = await RegisterAndLogin(UniqueEmail());
        var bytes = new byte[11_000_000];
        for (int i = 0; i < bytes.Length; i++) bytes[i] = (byte)'a';

        using var form = BuildForm(bytes);
        using var req = new HttpRequestMessage(HttpMethod.Post, "/api/import/contacts") { Content = form };
        req.Headers.Add("Cookie", cookie);
        var res = await client.SendAsync(req);
        Assert.Equal((HttpStatusCode)413, res.StatusCode);
    }
}
