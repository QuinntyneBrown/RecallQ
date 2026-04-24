namespace RecallQ.Api.Embeddings;

public interface IEmbeddingClient
{
    string Model { get; }
    int Dimensions { get; }
    Task<float[]> EmbedAsync(string text, CancellationToken ct);
}
