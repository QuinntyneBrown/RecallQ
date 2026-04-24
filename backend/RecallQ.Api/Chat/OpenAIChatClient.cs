using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Runtime.CompilerServices;
using System.Text.Json;
using Microsoft.Extensions.Options;
using RecallQ.Api.Embeddings;

namespace RecallQ.Api.Chat;

public class OpenAIChatClient : IChatClient
{
    private readonly HttpClient _http;
    private readonly OpenAIOptions _options;

    public OpenAIChatClient(HttpClient http, IOptions<OpenAIOptions> options)
    {
        _http = http;
        _options = options.Value;
    }

    public string Model => _options.ChatModel;

    public async IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, [EnumeratorCancellation] CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
            throw new InvalidOperationException("OpenAI API key not configured");

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        req.Content = JsonContent.Create(new
        {
            model = _options.ChatModel,
            stream = true,
            messages = messages.Select(m => new { role = m.Role, content = m.Content }).ToArray(),
        });

        using var res = await _http.SendAsync(req, HttpCompletionOption.ResponseHeadersRead, ct);
        res.EnsureSuccessStatusCode();

        using var stream = await res.Content.ReadAsStreamAsync(ct);
        using var reader = new StreamReader(stream);

        while (!reader.EndOfStream)
        {
            var line = await reader.ReadLineAsync(ct);
            if (string.IsNullOrEmpty(line)) continue;
            if (!line.StartsWith("data:", StringComparison.Ordinal)) continue;
            var payload = line["data:".Length..].Trim();
            if (payload == "[DONE]") yield break;

            string? token = null;
            try
            {
                using var doc = JsonDocument.Parse(payload);
                if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
                {
                    var choice = choices[0];
                    if (choice.TryGetProperty("delta", out var delta) &&
                        delta.TryGetProperty("content", out var content) &&
                        content.ValueKind == JsonValueKind.String)
                    {
                        token = content.GetString();
                    }
                }
            }
            catch (JsonException) { }

            if (!string.IsNullOrEmpty(token)) yield return token!;
        }
    }

    public async Task<string> CompleteAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_options.ApiKey))
            throw new InvalidOperationException("OpenAI API key not configured");

        using var req = new HttpRequestMessage(HttpMethod.Post, "https://api.openai.com/v1/chat/completions");
        req.Headers.Authorization = new AuthenticationHeaderValue("Bearer", _options.ApiKey);
        req.Content = JsonContent.Create(new
        {
            model = _options.ChatModel,
            stream = false,
            max_tokens = 40,
            temperature = 0.2,
            messages = messages.Select(m => new { role = m.Role, content = m.Content }).ToArray(),
        });

        using var res = await _http.SendAsync(req, ct);
        res.EnsureSuccessStatusCode();
        var body = await res.Content.ReadAsStringAsync(ct);
        using var doc = JsonDocument.Parse(body);
        if (doc.RootElement.TryGetProperty("choices", out var choices) && choices.GetArrayLength() > 0)
        {
            var choice = choices[0];
            if (choice.TryGetProperty("message", out var msg) &&
                msg.TryGetProperty("content", out var content) &&
                content.ValueKind == JsonValueKind.String)
            {
                return content.GetString() ?? string.Empty;
            }
        }
        return string.Empty;
    }
}
