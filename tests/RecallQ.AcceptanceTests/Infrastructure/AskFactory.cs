using System.Collections.Concurrent;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using RecallQ.Api.Chat;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class AskFactory : RecallqFactory
{
    public readonly ConcurrentBag<string> LogMessages = new();
    public FakeChatClient ChatClient { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureLogging(logging =>
        {
            logging.AddProvider(new TestLoggerProvider(LogMessages));
        });
        base.ConfigureWebHost(builder);
        builder.ConfigureServices(services =>
        {
            var existing = services.Where(d => d.ServiceType == typeof(IChatClient)).ToList();
            foreach (var d in existing) services.Remove(d);
            services.AddSingleton<IChatClient>(ChatClient);
        });
    }
}
