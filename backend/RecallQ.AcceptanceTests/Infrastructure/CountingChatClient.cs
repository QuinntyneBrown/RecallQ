using RecallQ.Api.Chat;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class CountingChatClient : IChatClient
{
    private readonly IChatClient _inner;
    private int _count;
    public CountingChatClient(IChatClient inner) { _inner = inner; }
    public int Count => _count;
    public string Model => _inner.Model;
    public IAsyncEnumerable<string> StreamAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct)
        => _inner.StreamAsync(messages, ct);
    public Task<string> CompleteAsync(IReadOnlyList<ChatMessage> messages, CancellationToken ct)
    {
        Interlocked.Increment(ref _count);
        return _inner.CompleteAsync(messages, ct);
    }
}
