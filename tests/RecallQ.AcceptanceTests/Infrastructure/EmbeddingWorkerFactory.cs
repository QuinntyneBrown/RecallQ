using System.Collections.Concurrent;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Hosting;
using Microsoft.AspNetCore.Hosting;
using Serilog;
using Serilog.Formatting.Compact;

namespace RecallQ.AcceptanceTests.Infrastructure;

public class EmbeddingWorkerFactory : RecallqFactory
{
    public readonly ConcurrentBag<string> LogMessages = new();

    public EmbeddingWorkerFactory()
    {
        UseRealEmbeddingWorker = true;
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
    }
}

public class TestLoggerProvider : ILoggerProvider
{
    private readonly ConcurrentBag<string> _sink;
    public TestLoggerProvider(ConcurrentBag<string> sink) { _sink = sink; }
    public Microsoft.Extensions.Logging.ILogger CreateLogger(string categoryName) => new TestLogger(_sink, categoryName);
    public void Dispose() { }
}

public class TestLogger : Microsoft.Extensions.Logging.ILogger
{
    private readonly ConcurrentBag<string> _sink;
    private readonly string _category;
    public TestLogger(ConcurrentBag<string> sink, string category) { _sink = sink; _category = category; }
    public IDisposable? BeginScope<TState>(TState state) where TState : notnull => null;
    public bool IsEnabled(LogLevel logLevel) => true;
    public void Log<TState>(LogLevel logLevel, EventId eventId, TState state, Exception? exception, Func<TState, Exception?, string> formatter)
    {
        var msg = formatter(state, exception);
        _sink.Add($"[{_category}] {msg}");
        if (exception is not null) _sink.Add(exception.ToString());
    }
}
