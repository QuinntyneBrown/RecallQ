using System.Runtime.CompilerServices;

namespace RecallQ.Api.Chat;

public class FakeChatClient : IChatClient
{
    public static readonly string[] DefaultTokens = new[] { "Based ", "on ", "your ", "network…" };

    public string Model => "fake-chat";
    public TimeSpan TokenDelay { get; set; } = TimeSpan.Zero;
    public IReadOnlyList<string> Tokens { get; set; } = DefaultTokens;
    public string CompletionResponse { get; set; } = "[\"What about Series A?\",\"Who's closing this week?\",\"Recent AI investors?\"]";

    public async IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, [EnumeratorCancellation] CancellationToken ct)
    {
        foreach (var t in Tokens)
        {
            if (TokenDelay > TimeSpan.Zero) await Task.Delay(TokenDelay, ct);
            ct.ThrowIfCancellationRequested();
            yield return t;
        }
    }

    public Task<string> CompleteAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct)
        => Task.FromResult(CompletionResponse);
}
