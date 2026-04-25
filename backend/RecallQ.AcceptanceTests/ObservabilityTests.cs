// Traces to: L2-069, L2-070, L2-071
// Task: T030
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Text.RegularExpressions;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class ObservabilityTests : IClassFixture<ObservabilityFactory>
{
    private readonly ObservabilityFactory _factory;
    public ObservabilityTests(ObservabilityFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"obs{Guid.NewGuid():N}@example.com";

    private static string ExtractCookie(HttpResponseMessage r)
    {
        r.Headers.TryGetValues("Set-Cookie", out var cookies);
        foreach (var c in cookies!)
            if (c.StartsWith("rq_auth=", StringComparison.Ordinal))
            { var s = c.IndexOf(';'); return s > 0 ? c[..s] : c; }
        throw new Xunit.Sdk.XunitException("no cookie");
    }

    private async Task<(HttpClient client, string cookie)> RegisterLogin(string? email = null)
    {
        email ??= UniqueEmail();
        var client = _factory.CreateClient();
        await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw });
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        return (client, ExtractCookie(login));
    }

    [Fact]
    public async Task Correlation_id_echoed_in_response_header()
    {
        var client = _factory.CreateClient();
        var hex32 = new Regex("^[0-9a-fA-F]{32}$");

        using var req1 = new HttpRequestMessage(HttpMethod.Get, "/api/ping");
        req1.Headers.Add("X-Correlation-Id", "abc123");
        var res1 = await client.SendAsync(req1);
        Assert.True(res1.Headers.TryGetValues("X-Correlation-Id", out var v1));
        var echoed = string.Join(",", v1!);
        Assert.Matches(hex32, echoed);

        var res2 = await client.GetAsync("/api/ping");
        Assert.True(res2.Headers.TryGetValues("X-Correlation-Id", out var v2));
        var generated = string.Join(",", v2!);
        Assert.False(string.IsNullOrWhiteSpace(generated));
        Assert.Matches(hex32, generated);
    }

    [Fact]
    public async Task Correlation_id_rejects_non_guid_and_regenerates()
    {
        var client = _factory.CreateClient();
        var hex32 = new Regex("^[0-9a-fA-F]{32}$");

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/ping");
        req.Headers.Add("X-Correlation-Id", "hello world\nSEVERE: injected");
        var res = await client.SendAsync(req);

        Assert.True(res.Headers.TryGetValues("X-Correlation-Id", out var v));
        var echoed = string.Join(",", v!);
        Assert.Matches(hex32, echoed);
        Assert.DoesNotContain("hello", echoed);
        Assert.DoesNotContain("SEVERE", echoed);
    }

    [Fact]
    public async Task Correlation_id_accepts_valid_guid_and_echoes()
    {
        var client = _factory.CreateClient();
        var marker = Guid.NewGuid().ToString("N");

        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/ping");
        req.Headers.Add("X-Correlation-Id", marker);
        var res = await client.SendAsync(req);

        Assert.True(res.Headers.TryGetValues("X-Correlation-Id", out var v));
        Assert.Equal(marker, string.Join(",", v!));
    }

    [Fact]
    public async Task Correlation_id_present_on_every_log_entry()
    {
        _factory.Sink.Clear();
        var client = _factory.CreateClient();
        var marker = Guid.NewGuid().ToString("N");
        using var req = new HttpRequestMessage(HttpMethod.Get, "/api/ping");
        req.Headers.Add("X-Correlation-Id", marker);
        var res = await client.SendAsync(req);
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        Assert.True(res.Headers.TryGetValues("X-Correlation-Id", out var hv));
        Assert.Equal(marker, string.Join(",", hv!));

        // Sleep briefly to let async log events flush.
        await Task.Delay(100);

        var eventsWithCorrelation = _factory.Sink.Events
            .Where(e => e.Properties.TryGetValue("CorrelationId", out var c) && c == marker)
            .ToList();
        Assert.NotEmpty(eventsWithCorrelation);
    }

    [Fact]
    public async Task Metrics_endpoint_exposes_labeled_histograms()
    {
        // Warm up metrics by issuing at least one search + embed + ask.
        var (client, cookie) = await RegisterLogin();
        using var searchReq = new HttpRequestMessage(HttpMethod.Get, "/api/search?q=warmup");
        searchReq.Headers.Add("Cookie", cookie);
        await client.SendAsync(searchReq);

        using var askReq = new HttpRequestMessage(HttpMethod.Post, "/api/ask")
        {
            Content = JsonContent.Create(new { q = "hi" })
        };
        askReq.Headers.Add("Cookie", cookie);
        using var askRes = await client.SendAsync(askReq, HttpCompletionOption.ResponseHeadersRead);
        await askRes.Content.ReadAsStringAsync();

        var res = await client.GetAsync("/metrics");
        Assert.Equal(HttpStatusCode.OK, res.StatusCode);
        var body = await res.Content.ReadAsStringAsync();
        Assert.Contains("recallq_search_latency_seconds", body);
        Assert.Contains("recallq_api_latency_seconds", body);
        Assert.Contains("recallq_llm_tokens_total", body);
        // Embedding histogram is registered at startup via the static class load; the metric name appears in /metrics exposition regardless of observations.
        Assert.Contains("recallq_embedding_latency_seconds", body);
        Assert.Contains("recallq_http_requests_total", body);
        Assert.Matches(new Regex(@"recallq_http_requests_total\{[^}]*status_code=""\d+""[^}]*\}\s+[0-9]"), body);
        Assert.Matches(new Regex(@"recallq_api_latency_seconds_bucket\{[^}]*endpoint=""[^""]+""[^}]*status=""\d+""[^}]*le="), body);
    }

    [Fact]
    public async Task Llm_tokens_counter_increments_on_ask_request()
    {
        var (client, cookie) = await RegisterLogin();

        double ReadOut(string body)
        {
            // Match lines like: recallq_llm_tokens_total{direction="out"} 12
            var m = Regex.Match(body, @"recallq_llm_tokens_total\{[^}]*direction=""out""[^}]*\}\s+([0-9]+(?:\.[0-9]+)?)");
            return m.Success ? double.Parse(m.Groups[1].Value, System.Globalization.CultureInfo.InvariantCulture) : 0.0;
        }

        var before = ReadOut(await (await client.GetAsync("/metrics")).Content.ReadAsStringAsync());

        using var askReq = new HttpRequestMessage(HttpMethod.Post, "/api/ask")
        {
            Content = JsonContent.Create(new { q = "please tell me a slightly longer question so tokens accumulate" })
        };
        askReq.Headers.Add("Cookie", cookie);
        using var askRes = await client.SendAsync(askReq, HttpCompletionOption.ResponseHeadersRead);
        using var stream = await askRes.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        while (await reader.ReadLineAsync() != null) { /* drain */ }

        var after = ReadOut(await (await client.GetAsync("/metrics")).Content.ReadAsStringAsync());
        Assert.True(after > before, $"Expected out-counter to increase. before={before} after={after}");
    }

    [Fact]
    public async Task Logs_never_contain_q_content_email_or_phone()
    {
        _factory.Sink.Clear();
        const string distinctiveEmail = "ZANZIBAR_EMAIL_42@example.com";
        const string distinctiveContent = "ZANZIBAR_CONTENT_42";
        const string distinctiveQuery = "ZANZIBAR_QUERY_42";
        const string distinctivePhone = "+15550ZANZIBAR42";

        var (client, cookie) = await RegisterLogin();

        var contactPayload = new
        {
            displayName = "Zanzibar Target",
            initials = "ZT",
            emails = new[] { distinctiveEmail },
            phones = new[] { distinctivePhone },
        };
        using var cReq = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        { Content = JsonContent.Create(contactPayload) };
        cReq.Headers.Add("Cookie", cookie);
        var cRes = await client.SendAsync(cReq);
        var cBody = await cRes.Content.ReadFromJsonAsync<JsonElement>();
        var contactId = cBody.GetProperty("id").GetGuid();

        var interactionPayload = new
        {
            type = "call",
            occurredAt = DateTime.UtcNow,
            subject = "intro",
            content = distinctiveContent,
        };
        using var iReq = new HttpRequestMessage(HttpMethod.Post, $"/api/contacts/{contactId}/interactions")
        { Content = JsonContent.Create(interactionPayload) };
        iReq.Headers.Add("Cookie", cookie);
        await client.SendAsync(iReq);

        using var sReq = new HttpRequestMessage(HttpMethod.Get, $"/api/search?q={Uri.EscapeDataString(distinctiveQuery)}");
        sReq.Headers.Add("Cookie", cookie);
        await client.SendAsync(sReq);

        await Task.Delay(200);

        foreach (var ev in _factory.Sink.Events.ToArray())
        {
            Assert.DoesNotContain(distinctiveEmail, ev.CompactJson, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(distinctiveContent, ev.CompactJson, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(distinctiveQuery, ev.CompactJson, StringComparison.OrdinalIgnoreCase);
            Assert.DoesNotContain(distinctivePhone, ev.CompactJson, StringComparison.OrdinalIgnoreCase);
        }
    }
}
