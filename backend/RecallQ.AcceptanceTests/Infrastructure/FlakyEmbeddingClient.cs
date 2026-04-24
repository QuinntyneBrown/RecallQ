using RecallQ.Api.Embeddings;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class FlakyEmbeddingClient : IEmbeddingClient
{
    private readonly IEmbeddingClient _inner;
    private int _remainingFailures;

    public FlakyEmbeddingClient(IEmbeddingClient inner, int failureCount)
    {
        _inner = inner;
        _remainingFailures = failureCount;
    }

    public string Model => _inner.Model;
    public int Dimensions => _inner.Dimensions;

    public Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        if (Interlocked.Decrement(ref _remainingFailures) >= 0)
            throw new HttpRequestException("transient");
        return _inner.EmbedAsync(text, ct);
    }
}
