// Covers bug: docs/bugs/login-timing-side-channel-reveals-email-existence.md
// Flow 02 — Login's two failure paths (unknown email vs known email +
// wrong password) must take indistinguishable time. The standard
// mitigation runs Argon2.Verify with a dummy hash on the
// unknown-email path. We assert the runtime ratio is bounded:
// the unknown-email path should not be faster than ~half the
// known-email path. With the bug present, it is roughly 1/20×.
using System.Diagnostics;
using System.Net;
using System.Net.Http.Json;

namespace RecallQ.AcceptanceTests;

public class LoginTimingSideChannelTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public LoginTimingSideChannelTests(RecallqFactory factory) { _factory = factory; }

    private const string Pw = "correcthorse12";
    private static string UniqueEmail() => $"user{Guid.NewGuid():N}@example.com";

    private static async Task<long> TimePostAsync(HttpClient client, string email, string password)
    {
        // Warm up DNS / connection pool first by hitting the same path once.
        // (Not strictly required; cookies/middleware are stable across calls.)
        var sw = Stopwatch.StartNew();
        var res = await client.PostAsJsonAsync("/api/auth/login", new { email, password });
        sw.Stop();
        Assert.Equal(HttpStatusCode.Unauthorized, res.StatusCode);
        return sw.ElapsedMilliseconds;
    }

    [Fact]
    public async Task Unknown_email_and_known_email_with_wrong_password_take_similar_time()
    {
        var client = _factory.CreateClient();

        // Register 4 distinct known emails so rate-limit per (ip, email)
        // doesn't trip — each known sample uses a different email.
        var knowns = new List<string>();
        for (int i = 0; i < 4; i++)
        {
            var e = UniqueEmail();
            Assert.Equal(
                HttpStatusCode.Created,
                (await client.PostAsJsonAsync("/api/auth/register", new { email = e, password = Pw })).StatusCode);
            knowns.Add(e);
        }

        // Warm up against the first known email (1 attempt — well under
        // the 5/min limit).
        await TimePostAsync(client, knowns[0], "this_is_wrong");

        // Sample three knowns (use one untouched + two more) and three
        // unknowns. Each request uses a fresh email so the rate-limit
        // bucket per (ip, email) sees at most 1 attempt.
        async Task<long> MedianOf(IEnumerable<string> emails)
        {
            var samples = new List<long>();
            foreach (var e in emails)
                samples.Add(await TimePostAsync(client, e, "this_is_wrong"));
            samples.Sort();
            return samples[samples.Count / 2];
        }

        var unknownTime = await MedianOf(new[] { UniqueEmail(), UniqueEmail(), UniqueEmail() });
        var knownTime = await MedianOf(new[] { knowns[1], knowns[2], knowns[3] });

        // The unknown-email path must not be dramatically faster than
        // the known-email path. Allow a 2× ratio for normal jitter; a
        // 10×+ ratio (the actual bug) fails the assertion.
        Assert.True(
            unknownTime * 2 >= knownTime,
            $"Login timing leaks email existence: unknown={unknownTime}ms, known={knownTime}ms (ratio {(double)knownTime / Math.Max(unknownTime, 1):F1}×). Argon2.Verify must run on both paths.");
    }
}
