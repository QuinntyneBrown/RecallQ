using System.Threading.Channels;
using Microsoft.AspNetCore.Authentication;
using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Npgsql;
using RecallQ.Api;
using RecallQ.Api.Chat;
using RecallQ.Api.Embeddings;
using RecallQ.Api.Endpoints;
using RecallQ.Api.Security;
using RecallQ.Api.Stacks;
using RecallQ.Api.Suggestions;
using RecallQ.Api.Summaries;

var builder = WebApplication.CreateBuilder(args);

builder.WebHost.ConfigureKestrel(k => k.Limits.MaxRequestBodySize = 10_000_000);
builder.Services.Configure<Microsoft.AspNetCore.Http.Features.FormOptions>(o =>
{
    o.MultipartBodyLengthLimit = 10_000_000;
    o.ValueLengthLimit = 4_000_000;
});

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Host=localhost;Port=5432;Database=recallq;Username=recallq;Password=recallq";

var dataSourceBuilder = new NpgsqlDataSourceBuilder(connectionString);
dataSourceBuilder.UseVector();
var dataSource = dataSourceBuilder.Build();
builder.Services.AddSingleton(dataSource);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(dataSource, o => o.UseVector())
           .ConfigureWarnings(w => w.Ignore(Microsoft.EntityFrameworkCore.Diagnostics.CoreEventId.ManyServiceProvidersCreatedWarning)));

builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

builder.Services.AddHttpContextAccessor();
builder.Services.AddScoped<ICurrentUser, CurrentUser>();
builder.Services.AddSingleton<Argon2Hasher>();
builder.Services.AddSingleton<SessionRevocationStore>();

builder.Services.AddSingleton(Channel.CreateUnbounded<EmbeddingJob>());
builder.Services.AddSingleton<ChannelWriter<EmbeddingJob>>(sp => sp.GetRequiredService<Channel<EmbeddingJob>>().Writer);
builder.Services.AddSingleton<ChannelReader<EmbeddingJob>>(sp => sp.GetRequiredService<Channel<EmbeddingJob>>().Reader);
builder.Services.Configure<OpenAIOptions>(builder.Configuration.GetSection("Embeddings:OpenAI"));
var embeddingsProvider = builder.Configuration["Embeddings:Provider"];
var openAiKey = builder.Configuration["Embeddings:OpenAI:ApiKey"];
var useFake = string.Equals(embeddingsProvider, "fake", StringComparison.OrdinalIgnoreCase)
              || string.IsNullOrWhiteSpace(openAiKey);
if (useFake)
{
    builder.Services.AddSingleton<IEmbeddingClient, FakeEmbeddingClient>();
    builder.Services.AddSingleton<IChatClient, FakeChatClient>();
}
else
{
    builder.Services.AddHttpClient<IEmbeddingClient, OpenAIEmbeddingClient>();
    builder.Services.AddHttpClient<IChatClient, OpenAIChatClient>();
}
builder.Services.AddHostedService<EmbeddingWorker>();
builder.Services.AddSingleton<EmbeddingBackfillRunner>();
builder.Services.AddScoped<CitationRetriever>();
builder.Services.AddScoped<FollowUpGenerator>();
builder.Services.AddScoped<IntroDraftGenerator>();

builder.Services.AddSingleton(Channel.CreateUnbounded<SummaryRefreshJob>());
builder.Services.AddSingleton<ChannelWriter<SummaryRefreshJob>>(sp => sp.GetRequiredService<Channel<SummaryRefreshJob>>().Writer);
builder.Services.AddSingleton<ChannelReader<SummaryRefreshJob>>(sp => sp.GetRequiredService<Channel<SummaryRefreshJob>>().Reader);
builder.Services.AddHostedService<SummaryWorker>();

builder.Services.AddSingleton(new SuggestionDetectorOptions());
builder.Services.AddSingleton<SuggestionDetector>();
builder.Services.AddSingleton<Microsoft.Extensions.Hosting.IHostedService, SuggestionDetectorHostedService>();

builder.Services.AddSingleton<StackCountCacheOptions>();
builder.Services.AddSingleton<StackCountCache>();
builder.Services.AddScoped<StackCountCalculator>();

builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "rq_auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Strict;
        options.Cookie.SecurePolicy = builder.Environment.IsProduction()
            ? CookieSecurePolicy.Always
            : CookieSecurePolicy.SameAsRequest;
        options.Cookie.Path = "/";
        options.Events.OnRedirectToLogin = ctx => { ctx.Response.StatusCode = 401; return Task.CompletedTask; };
        options.Events.OnRedirectToAccessDenied = ctx => { ctx.Response.StatusCode = 403; return Task.CompletedTask; };
        options.Events.OnValidatePrincipal = async ctx =>
        {
            var sidClaim = ctx.Principal?.FindFirst("sid")?.Value;
            if (Guid.TryParse(sidClaim, out var sid))
            {
                var store = ctx.HttpContext.RequestServices.GetRequiredService<SessionRevocationStore>();
                if (store.IsRevoked(sid))
                {
                    ctx.RejectPrincipal();
                    await ctx.HttpContext.SignOutAsync(CookieAuthenticationDefaults.AuthenticationScheme);
                }
            }
        };
    });
builder.Services.AddAuthorization();
builder.Services.AddLoginRateLimit();

const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy => policy
        .WithOrigins("http://localhost:4200")
        .WithMethods("GET", "POST", "PATCH", "DELETE")
        .AllowAnyHeader());
});

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    try
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
        try
        {
            await db.Database.ExecuteSqlRawAsync("CREATE EXTENSION IF NOT EXISTS vector;");
            await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS ix_contact_embeddings_vector ON contact_embeddings USING hnsw (embedding vector_cosine_ops);");
            await db.Database.ExecuteSqlRawAsync("CREATE INDEX IF NOT EXISTS ix_interaction_embeddings_vector ON interaction_embeddings USING hnsw (embedding vector_cosine_ops);");
        }
        catch (Exception ex)
        {
            app.Logger.LogWarning(ex, "HNSW index creation skipped.");
        }
    }
    catch (Exception ex)
    {
        app.Logger.LogWarning(ex, "Database initialization skipped.");
    }
}

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors(DevCorsPolicy);
app.UseLoginEmailExtractor();
app.UseAuthentication();
app.UseAuthorization();
app.UseRateLimiter();

app.MapHealthChecks("/health");
app.MapPing();
app.MapAuth();
app.MapContacts();
app.MapInteractions();
app.MapAdmin();
app.MapSearch();
app.MapAsk();
app.MapSummaries();
app.MapStacks();
app.MapSuggestions();
app.MapIntroDrafts();
app.MapImport();

app.Run();

public partial class Program { }
