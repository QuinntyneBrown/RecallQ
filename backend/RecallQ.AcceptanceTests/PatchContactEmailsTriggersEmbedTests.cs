// Covers bug: docs/bugs/patch-contact-emails-change-does-not-re-embed.md
// Flow 08 — PATCH contact must enqueue an embedding job when an
// embedded text field changes. Emails are part of the worker's
// source text (per EmbeddingWorker), but the PATCH path never sets
// needsEmbedding=true for emails, so the embedding rots.
using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Channels;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Entities;

namespace RecallQ.AcceptanceTests;

public class PatchContactEmailsTriggersEmbedTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;
    public PatchContactEmailsTriggersEmbedTests(RecallqFactory factory) { _factory = factory; }

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
    public async Task Patching_emails_enqueues_an_embedding_job()
    {
        // Register + login.
        var email = UniqueEmail();
        var client = _factory.CreateClient();
        Assert.Equal(HttpStatusCode.Created, (await client.PostAsJsonAsync("/api/auth/register", new { email, password = Pw })).StatusCode);
        var login = await client.PostAsJsonAsync("/api/auth/login", new { email, password = Pw });
        var cookie = ExtractCookie(login);

        // Create a contact via API. This already enqueues the initial
        // embedding job — drain it so the channel is empty before the
        // PATCH.
        var createReq = new HttpRequestMessage(HttpMethod.Post, "/api/contacts")
        {
            Content = JsonContent.Create(new
            {
                displayName = "Avery Embedded",
                initials = "AE",
                emails = new[] { "avery@old.com" },
            })
        };
        createReq.Headers.Add("Cookie", cookie);
        var createRes = await client.SendAsync(createReq);
        Assert.Equal(HttpStatusCode.Created, createRes.StatusCode);
        var createdJson = await createRes.Content.ReadFromJsonAsync<JsonElement>();
        var contactId = createdJson.GetProperty("id").GetGuid();

        // Drain whatever was enqueued by the create path so the next
        // assertion reflects only what the PATCH writes.
        var reader = _factory.Services.GetRequiredService<ChannelReader<EmbeddingJob>>();
        while (reader.TryRead(out _)) { /* drain */ }

        // PATCH the emails — the embedded text now references a new
        // domain. The embedding job MUST be enqueued.
        var patchReq = new HttpRequestMessage(HttpMethod.Patch, $"/api/contacts/{contactId}")
        {
            Content = JsonContent.Create(new { emails = new[] { "avery@stripe.com" } })
        };
        patchReq.Headers.Add("Cookie", cookie);
        var patchRes = await client.SendAsync(patchReq);
        Assert.Equal(HttpStatusCode.OK, patchRes.StatusCode);

        // Wait briefly for the writer to land. With the current bug, no
        // job is enqueued and the read returns false.
        var deadline = DateTime.UtcNow.AddSeconds(2);
        EmbeddingJob? job = null;
        while (DateTime.UtcNow < deadline)
        {
            if (reader.TryRead(out var j)) { job = j; break; }
            await Task.Delay(50);
        }

        Assert.NotNull(job);
        Assert.Equal(contactId, job!.Id);
        Assert.Equal("contact", job.Kind);
    }
}
