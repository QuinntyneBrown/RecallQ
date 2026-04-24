using Microsoft.EntityFrameworkCore;
using RecallQ.Api;

var builder = WebApplication.CreateBuilder(args);

var connectionString = builder.Configuration.GetConnectionString("Default")
    ?? "Host=localhost;Port=5432;Database=recallq;Username=recallq;Password=recallq";

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, o => o.UseVector()));

var app = builder.Build();

app.MapGet("/", () => "RecallQ API");

app.Run();

public partial class Program { }
