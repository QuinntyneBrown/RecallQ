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

            services.AddDbContext<AppDbContext>(options =>
                options.UseNpgsql(ConnectionString, o => o.UseVector()));

            var hosted = services.Where(d => d.ImplementationType == typeof(NullEmbeddingConsumer)).ToList();
            foreach (var d in hosted) services.Remove(d);

            services.AddSingleton(CapturedJobs);
            services.AddHostedService<CapturingEmbeddingConsumer>();
        });
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
