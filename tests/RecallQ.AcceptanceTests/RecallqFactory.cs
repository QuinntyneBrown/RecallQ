using System.Collections.Concurrent;
using System.Threading.Channels;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Npgsql;
using RecallQ.Api;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Summaries;
using Testcontainers.PostgreSql;

namespace RecallQ.AcceptanceTests;

public class RecallqFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithImage("pgvector/pgvector:pg16")
        .WithDatabase("recallq")
        .WithUsername("recallq")
        .WithPassword("recallq")
        .Build();

    public string ConnectionString => _postgres.GetConnectionString();

    public readonly ConcurrentBag<EmbeddingJob> CapturedJobs = new();
    public readonly ConcurrentBag<SummaryRefreshJob> SummaryRefreshJobs = new();
    public bool UseRealEmbeddingWorker { get; set; } = false;
    public bool UseRealSummaryWorker { get; set; } = false;
    public Func<IServiceProvider, IEmbeddingClient>? EmbeddingClientFactory { get; set; }
    public Func<IServiceProvider, RecallQ.Api.Chat.IChatClient>? ChatClientFactory { get; set; }

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();
        await using var conn = new NpgsqlConnection(ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand("CREATE EXTENSION IF NOT EXISTS vector;", conn);
        await cmd.ExecuteNonQueryAsync();
    }

    public new async Task DisposeAsync()
    {
        await _postgres.DisposeAsync();
    }

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            var descriptor = services.SingleOrDefault(
                d => d.ServiceType == typeof(DbContextOptions<AppDbContext>));
            if (descriptor is not null) services.Remove(descriptor);

            var dsBuilder = new NpgsqlDataSourceBuilder(ConnectionString);
            dsBuilder.UseVector();
            var dataSource = dsBuilder.Build();

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(dataSource, o => o.UseVector())
                       .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.ManyServiceProvidersCreatedWarning)));

            var hosted = services.Where(d =>
                d.ImplementationType == typeof(NullEmbeddingConsumer)
                || d.ImplementationType == typeof(NullSummaryConsumer)
                || d.ImplementationType == typeof(EmbeddingWorker)
                || d.ImplementationType == typeof(SummaryWorker)).ToList();
            foreach (var d in hosted) services.Remove(d);

            services.AddSingleton(CapturedJobs);
            services.AddSingleton(SummaryRefreshJobs);

            if (UseRealSummaryWorker)
            {
                var chatDescriptors = services.Where(d => d.ServiceType == typeof(RecallQ.Api.Chat.IChatClient)).ToList();
                foreach (var d in chatDescriptors) services.Remove(d);
                if (ChatClientFactory is not null)
                    services.AddSingleton<RecallQ.Api.Chat.IChatClient>(ChatClientFactory);
                else
                    services.AddSingleton<RecallQ.Api.Chat.IChatClient, RecallQ.Api.Chat.FakeChatClient>();
                services.AddHostedService<SummaryWorker>();
            }
            else
            {
                services.AddHostedService<CapturingSummaryConsumer>();
            }

            if (UseRealEmbeddingWorker)
            {
                // Swap IEmbeddingClient with fake (or custom factory)
                var clientDescriptors = services.Where(d => d.ServiceType == typeof(IEmbeddingClient)).ToList();
                foreach (var d in clientDescriptors) services.Remove(d);
                if (EmbeddingClientFactory is not null)
                    services.AddSingleton<IEmbeddingClient>(EmbeddingClientFactory);
                else
                    services.AddSingleton<IEmbeddingClient, FakeEmbeddingClient>();
                services.AddHostedService<EmbeddingWorker>();
            }
            else
            {
                services.AddHostedService<CapturingEmbeddingConsumer>();
            }
        });
    }
}

public class CapturingSummaryConsumer : BackgroundService
{
    private readonly ChannelReader<SummaryRefreshJob> _reader;
    private readonly ConcurrentBag<SummaryRefreshJob> _bag;

    public CapturingSummaryConsumer(ChannelReader<SummaryRefreshJob> reader, ConcurrentBag<SummaryRefreshJob> bag)
    {
        _reader = reader;
        _bag = bag;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var job = await _reader.ReadAsync(stoppingToken);
                _bag.Add(job);
            }
        }
        catch (OperationCanceledException) { }
    }
}

public class CapturingEmbeddingConsumer : BackgroundService
{
    private readonly ChannelReader<EmbeddingJob> _reader;
    private readonly ConcurrentBag<EmbeddingJob> _bag;

    public CapturingEmbeddingConsumer(ChannelReader<EmbeddingJob> reader, ConcurrentBag<EmbeddingJob> bag)
    {
        _reader = reader;
        _bag = bag;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        try
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                var job = await _reader.ReadAsync(stoppingToken);
                _bag.Add(job);
            }
        }
        catch (OperationCanceledException) { }
    }
}
