using System.Collections.Concurrent;
using System.IO;
using Serilog.Core;
using Serilog.Events;
using Serilog.Formatting.Compact;

namespace RecallQ.AcceptanceTests.Infrastructure;

public sealed class CapturedLogEvent
{
    public required string Rendered { get; init; }
    public required string CompactJson { get; init; }
    public IReadOnlyDictionary<string, string> Properties { get; init; } = new Dictionary<string, string>();
}

public sealed class CapturingSink : ILogEventSink
{
    public readonly ConcurrentBag<CapturedLogEvent> Events = new();
    private readonly CompactJsonFormatter _formatter = new();

    public void Emit(LogEvent logEvent)
    {
        var props = new Dictionary<string, string>();
        foreach (var kv in logEvent.Properties)
        {
            var v = kv.Value is ScalarValue sv ? sv.Value?.ToString() ?? "" : kv.Value.ToString();
            props[kv.Key] = v.Trim('"');
        }
        using var sw = new StringWriter();
        _formatter.Format(logEvent, sw);
        Events.Add(new CapturedLogEvent
        {
            Rendered = logEvent.RenderMessage(),
            CompactJson = sw.ToString(),
            Properties = props
        });
    }

    public void Clear()
    {
        while (Events.TryTake(out _)) { }
    }
}
