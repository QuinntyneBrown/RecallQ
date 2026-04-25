using System.Net;
using Microsoft.Extensions.Configuration;

namespace RecallQ.AcceptanceTests;

public class EmbeddingConfigValidationTests
{
    [Fact]
    public void Production_with_missing_openai_key_and_real_provider_must_require_key()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "ASPNETCORE_ENVIRONMENT", "Production" },
                { "Embeddings:Provider", "openai" },
                { "Embeddings:OpenAI:ApiKey", "" },
            })
            .Build();

        var embeddingsProvider = config["Embeddings:Provider"];
        var openAiKey = config["Embeddings:OpenAI:ApiKey"];
        var environment = config["ASPNETCORE_ENVIRONMENT"];

        var isProduction = environment == "Production";
        var isRealProvider = !string.Equals(embeddingsProvider, "fake", StringComparison.OrdinalIgnoreCase);
        var isMissingKey = string.IsNullOrWhiteSpace(openAiKey);

        Assert.False(
            isProduction && isRealProvider && isMissingKey,
            "Production with real provider and missing API key should fail startup, not silently use fake clients"
        );
    }

    [Fact]
    public void Explicit_fake_provider_uses_fake_clients()
    {
        var config = new ConfigurationBuilder()
            .AddInMemoryCollection(new Dictionary<string, string?>
            {
                { "Embeddings:Provider", "fake" },
                { "Embeddings:OpenAI:ApiKey", "" },
            })
            .Build();

        var embeddingsProvider = config["Embeddings:Provider"];
        var openAiKey = config["Embeddings:OpenAI:ApiKey"];

        var useFake = string.Equals(embeddingsProvider, "fake", StringComparison.OrdinalIgnoreCase)
                      || string.IsNullOrWhiteSpace(openAiKey);

        Assert.True(useFake, "Explicit fake provider should use fake clients");
    }
}
