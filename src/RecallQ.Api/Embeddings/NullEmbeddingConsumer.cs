using System.Threading.Channels;
using Microsoft.Extensions.Hosting;

namespace RecallQ.Api.Embeddings;

public class NullEmbeddingConsumer : BackgroundService
{
    private readonly ChannelReader<EmbeddingJob> _reader;

    public NullEmbeddingConsumer(ChannelReader<EmbeddingJob> reader)
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
