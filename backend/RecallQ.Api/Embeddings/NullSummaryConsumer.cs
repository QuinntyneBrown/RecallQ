using System.Threading.Channels;
using Microsoft.Extensions.Hosting;

namespace RecallQ.Api.Embeddings;

public class NullSummaryConsumer : BackgroundService
{
    private readonly ChannelReader<SummaryRefreshJob> _reader;

    public NullSummaryConsumer(ChannelReader<SummaryRefreshJob> reader)
    {
        _reader = reader;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _ = await _reader.ReadAsync(stoppingToken);
            }
        }
        catch (OperationCanceledException) { }
    }
}
