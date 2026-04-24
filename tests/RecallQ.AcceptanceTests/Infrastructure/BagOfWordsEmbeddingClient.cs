using RecallQ.Api.Embeddings;

namespace RecallQ.AcceptanceTests.Infrastructure;

// Deterministic, content-sensitive embedding for search tests.
// Maps each unique lowercase token to a unique dimension (by hash modulo),
// counts occurrences, and L2-normalizes. Cosine similarity reflects token overlap.
public class BagOfWordsEmbeddingClient : IEmbeddingClient
{
    public string Model => "bag-of-words-test";
    public int Dimensions => 1536;

    public Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        var vec = new float[Dimensions];
        if (!string.IsNullOrWhiteSpace(text))
        {
            foreach (var tok in Tokenize(text))
            {
                var h = (uint)tok.GetHashCode();
                var idx = (int)(h % (uint)Dimensions);
                vec[idx] += 1f;
            }
            double sq = 0;
            for (int i = 0; i < Dimensions; i++) sq += vec[i] * vec[i];
            var norm = Math.Sqrt(sq);
            if (norm > 0) for (int i = 0; i < Dimensions; i++) vec[i] = (float)(vec[i] / norm);
        }
        return Task.FromResult(vec);
    }

    private static IEnumerable<string> Tokenize(string s)
    {
        var buf = new System.Text.StringBuilder();
        foreach (var ch in s.ToLowerInvariant())
        {
            if (char.IsLetterOrDigit(ch)) buf.Append(ch);
            else if (buf.Length > 0) { yield return buf.ToString(); buf.Clear(); }
        }
        if (buf.Length > 0) yield return buf.ToString();
    }
}
