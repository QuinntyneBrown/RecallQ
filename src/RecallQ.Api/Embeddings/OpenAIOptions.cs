namespace RecallQ.Api.Embeddings;

public class OpenAIOptions
{
    public string? ApiKey { get; set; }
    public string Model { get; set; } = "text-embedding-3-small";
}
