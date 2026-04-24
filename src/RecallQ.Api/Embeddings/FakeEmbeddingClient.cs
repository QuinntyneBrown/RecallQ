using System.Security.Cryptography;
using System.Text;

namespace RecallQ.Api.Embeddings;

public class FakeEmbeddingClient : IEmbeddingClient
{
    public string Model => "fake-deterministic";
    public int Dimensions => 1536;

    public Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        var hash = SHA256.HashData(Encoding.UTF8.GetBytes(text ?? string.Empty));
        var seed = BitConverter.ToInt32(hash, 0);
        var rand = new Random(seed);
        var vec = new float[Dimensions];
        double sumSq = 0;
        for (int i = 0; i < Dimensions; i++)
        {
            var v = (float)(rand.NextDouble() * 2.0 - 1.0);
            vec[i] = v;
            sumSq += v * v;
        }
        var norm = Math.Sqrt(sumSq);
        if (norm > 0)
            for (int i = 0; i < Dimensions; i++) vec[i] = (float)(vec[i] / norm);
        return Task.FromResult(vec);
    }
}
