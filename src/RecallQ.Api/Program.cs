using Microsoft.EntityFrameworkCore;
using RecallQ.Api;
using RecallQ.Api.Endpoints;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Host=localhost;Port=5432;Database=recallq;Username=recallq;Password=recallq";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, o => o.UseVector()));

builder.Services.AddHealthChecks().AddDbContextCheck<AppDbContext>();

const string DevCorsPolicy = "DevCors";
builder.Services.AddCors(options =>
{
    options.AddPolicy(DevCorsPolicy, policy => policy
        .WithOrigins("http://localhost:4200")
        .WithMethods("GET", "POST")
        .AllowAnyHeader());
});

var app = builder.Build();

if (app.Environment.IsProduction())
{
    app.UseHsts();
    app.UseHttpsRedirection();
}

app.UseCors(DevCorsPolicy);

app.MapHealthChecks("/health");
app.MapPing();

app.Run();

public partial class Program { }
