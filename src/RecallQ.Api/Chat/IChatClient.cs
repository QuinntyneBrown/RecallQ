namespace RecallQ.Api.Chat;

public interface IChatClient
{
    string Model { get; }
    IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct);
    Task<string> CompleteAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct);
}

public record ChatMessage(string Role, string Content);
