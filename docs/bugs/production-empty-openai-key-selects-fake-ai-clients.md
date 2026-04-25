# Empty OpenAI key silently selects fake AI clients

**Status:** Complete
**Source:** `docs/code-quality-audit.md` - Medium finding, "Production can silently fall back to fake AI clients"
**Severity:** Medium (deployment can appear healthy while returning fake AI behavior)

## Symptom

`backend/RecallQ.Api/Program.cs` selects fake embedding and chat clients
whenever the OpenAI API key is blank:

```csharp
var embeddingsProvider = builder.Configuration["Embeddings:Provider"];
var openAiKey = builder.Configuration["Embeddings:OpenAI:ApiKey"];
var useFake = string.Equals(embeddingsProvider, "fake", StringComparison.OrdinalIgnoreCase)
              || string.IsNullOrWhiteSpace(openAiKey);
if (useFake)
{
    builder.Services.AddSingleton<IEmbeddingClient, FakeEmbeddingClient>();
    builder.Services.AddSingleton<IChatClient, FakeChatClient>();
}
```

`backend/RecallQ.Api/appsettings.json` ships with an empty
`Embeddings:OpenAI:ApiKey`, so a deployment missing the secret can boot
with deterministic fake embeddings and fake chat.

## Expected

Fake AI clients are selected only by an explicit local/test
configuration, such as `Embeddings:Provider=fake`.

In production, a configured real provider with missing required secrets
fails startup clearly.

## Actual

Any environment with a blank OpenAI key falls back to fake clients,
including production.

## Repro

1. Start the API with `ASPNETCORE_ENVIRONMENT=Production` and no
   `Embeddings:OpenAI:ApiKey`.
2. Observe that DI registers `FakeEmbeddingClient` and `FakeChatClient`
   instead of failing configuration validation.

## Notes

Radically simple fix:

- Treat `Embeddings:Provider=fake` as the only fake-client switch.
- Require real provider secrets when the provider is not `fake`.
- Add startup validation that fails in production if fake is selected
  accidentally.
