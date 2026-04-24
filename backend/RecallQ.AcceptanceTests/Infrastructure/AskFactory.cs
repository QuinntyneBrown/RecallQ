using System.Collections.Concurrent;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RecallQ.Api.Chat;
using Serilog;
using Serilog.Formatting.Compact;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class AskFactory : RecallqFactory
{
    public readonly ConcurrentBag<string> LogMessages = new();
    public FakeChatClient ChatClient { get; } = new();

    public AskFactory()
    {
        UseRealEmbeddingWorker = true;
        EmbeddingClientFactory = _ => new BagOfWordsEmbeddingClient();
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.UseSerilog((ctx, cfg) => cfg
            .MinimumLevel.Debug()
            .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .WriteTo.Console(new CompactJsonFormatter())
            .WriteTo.Sink(new BagSink(LogMessages)),
            preserveStaticLogger: true);
        return base.CreateHost(builder);
    }

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

public sealed class BagSink : Serilog.Core.ILogEventSink
{
    private readonly ConcurrentBag<string> _bag;
    public BagSink(ConcurrentBag<string> bag) { _bag = bag; }
    public void Emit(Serilog.Events.LogEvent logEvent)
    {
        var src = logEvent.Properties.TryGetValue("SourceContext", out var s) && s is Serilog.Events.ScalarValue sv ? sv.Value?.ToString() ?? "" : "";
        _bag.Add($"[{src}] {logEvent.RenderMessage()}");
    }
}
