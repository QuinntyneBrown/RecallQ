using Microsoft.Extensions.DependencyInjection;
using RecallQ.Api.Chat;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class SummaryWorkerFactory : RecallqFactory
{
    public readonly FakeChatClient FakeChat = new()
    {
        CompletionResponse = "{\"paragraph\":\"They've been actively engaged this month.\",\"sentiment\":\"Warm\"}"
    };

    public SummaryWorkerFactory()
    {
        UseRealSummaryWorker = true;
        ChatClientFactory = _ => FakeChat;
    }
}
