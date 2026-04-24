using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using RecallQ.Api.Chat;
using Serilog;
using Serilog.Formatting.Compact;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class ObservabilityFactory : RecallqFactory
{
    public readonly CapturingSink Sink = new();
    public FakeChatClient ChatClient { get; } = new();

    public ObservabilityFactory()
    {
        UseRealEmbeddingWorker = true;
        EmbeddingClientFactory = _ => new BagOfWordsEmbeddingClient();
    }

    protected override IHost CreateHost(IHostBuilder builder)
    {
        builder.UseSerilog((ctx, cfg) => cfg
            .MinimumLevel.Debug()
            .MinimumLevel.Override("Microsoft.AspNetCore", Serilog.Events.LogEventLevel.Warning)
            .MinimumLevel.Override("Microsoft.Hosting.Lifetime", Serilog.Events.LogEventLevel.Information)
            .Enrich.FromLogContext()
            .Enrich.WithMachineName()
            .WriteTo.Console(new CompactJsonFormatter())
            .WriteTo.Sink(Sink),
            preserveStaticLogger: true);
        return base.CreateHost(builder);
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        base.ConfigureWebHost(builder);

        builder.ConfigureServices(services =>
        {
            var existing = services.Where(d => d.ServiceType == typeof(IChatClient)).ToList();
            foreach (var d in existing) services.Remove(d);
            services.AddSingleton<IChatClient>(ChatClient);
        });
    }
}
