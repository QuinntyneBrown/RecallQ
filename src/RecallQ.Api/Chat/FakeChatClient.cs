using System.Runtime.CompilerServices;

namespace RecallQ.Api.Chat;

public class FakeChatClient : IChatClient
{
    public static readonly string[] DefaultTokens = new[] { "Based ", "on ", "your ", "network…" };

    public string Model => "fake-chat";
    public TimeSpan TokenDelay { get; set; } = TimeSpan.Zero;
    public IReadOnlyList<string> Tokens { get; set; } = DefaultTokens;
    public string CompletionResponse { get; set; } = "[\"What about Series A?\",\"Who's closing this week?\",\"Recent AI investors?\"]";

    public IReadOnlyList<ChatMessage> LastMessages { get; private set; } = Array.Empty<ChatMessage>();
    public IReadOnlyList<ChatMessage> LastStreamMessages { get; private set; } = Array.Empty<ChatMessage>();

    public string LastSystemPrompt =>
        LastStreamMessages.FirstOrDefault(m => string.Equals(m.Role, "system", StringComparison.OrdinalIgnoreCase))?.Content
        ?? LastMessages.FirstOrDefault(m => string.Equals(m.Role, "system", StringComparison.OrdinalIgnoreCase))?.Content
        ?? string.Empty;

    public async IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, [EnumeratorCancellation] CancellationToken ct)
    {
        LastMessages = messages;
        LastStreamMessages = messages;
        foreach (var t in Tokens)
        {
            if (TokenDelay > TimeSpan.Zero) await Task.Delay(TokenDelay, ct);
            ct.ThrowIfCancellationRequested();
            yield return t;
        }
    }

    public Task<string> CompleteAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct)
    {
        LastMessages = messages;
        return Task.FromResult(CompletionResponse);
    }
}
