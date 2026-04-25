// Covers bug: docs/bugs/metrics-endpoint-label-cardinality-explodes-on-unmatched-routes.md
// Flow 38 — unmatched paths must collapse to one constant label, not
// one per literal request path. The middleware previously fell back to
// context.Request.Path.Value, blowing up Prometheus cardinality under
// any sustained 404 traffic.
using System.Net;
using System.Text.RegularExpressions;
using RecallQ.AcceptanceTests.Infrastructure;

namespace RecallQ.AcceptanceTests;

public class MetricsCardinalityTests : IClassFixture<ObservabilityFactory>
{
    private readonly ObservabilityFactory _factory;
    public MetricsCardinalityTests(ObservabilityFactory factory) { _factory = factory; }

    [Fact]
    public async Task Distinct_unmatched_paths_collapse_to_a_single_endpoint_label()
    {
        var client = _factory.CreateClient();

        // Three distinct paths that will not match any route.
        await client.GetAsync("/some-bogus/path-one");
        await client.GetAsync("/some-bogus/path-two");
        await client.GetAsync("/some-bogus/path-three");

        var metricsRes = await client.GetAsync("/metrics");
        Assert.Equal(HttpStatusCode.OK, metricsRes.StatusCode);
        var body = await metricsRes.Content.ReadAsStringAsync();

        // Each line under recallq_http_requests_total looks like:
        //   recallq_http_requests_total{endpoint="...",status_code="404"} N
        // The set of distinct endpoint=... values among 404 lines must be
        // small (<= 2). It would be 3+ if the literal request path bled
        // into the label.
        var regex = new Regex(@"recallq_http_requests_total\{[^}]*endpoint=""([^""]+)""[^}]*status_code=""404""[^}]*\}");
        var endpoints404 = regex.Matches(body)
            .Select(m => m.Groups[1].Value)
            .Distinct()
            .ToList();

        Assert.True(
            endpoints404.Count <= 2,
            $"Expected unmatched 404 traffic to collapse to a single endpoint label, but found {endpoints404.Count} distinct endpoints: {string.Join(", ", endpoints404)}");

        // Specifically, the literal request paths must not leak in.
        Assert.DoesNotContain("/some-bogus/path-one", body);
        Assert.DoesNotContain("/some-bogus/path-two", body);
        Assert.DoesNotContain("/some-bogus/path-three", body);
    }
}
