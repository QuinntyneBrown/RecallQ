using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using Microsoft.Extensions.Options;

namespace RecallQ.Api.Embeddings;

public class OpenAIEmbeddingClient : IEmbeddingClient
{
    private readonly HttpClient _http;
    private readonly OpenAIOptions _options;

    public OpenAIEmbeddingClient(HttpClient http, IOptions<OpenAIOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public string Model => _options.Model;
    public int Dimensions => 1536;

    public async Task<float[]> EmbedAsync(string text, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
            throw new InvalidOperationException("OpenAI API key not configured");

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/embeddings");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        req.Content = JsonContent.Create(new { model = _options.Model, input = text });

        using var res = await _http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();

        using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var doc = await JsonDocument.ParseAsync(stream, cancellationToken: ct);
        var arr = doc.RootElement.GetProperty("data")[0].GetProperty("embedding");
        var vec = new float[arr.GetArrayLength()];
        for (int i = 0; i < vec.Length; i++) vec[i] = arr[i].GetSingle();
        return vec;
    }
}
