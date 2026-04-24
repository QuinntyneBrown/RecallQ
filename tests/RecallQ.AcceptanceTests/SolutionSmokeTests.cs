// Traces to: L2-072, L2-073
// Task: T001
using Npgsql;

namespace RecallQ.AcceptanceTests;

public class SolutionSmokeTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public SolutionSmokeTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Db_is_reachable_and_pgvector_is_enabled()
    {
        await using var conn = new NpgsqlConnection(_factory.ConnectionString);
        await conn.OpenAsync();
        await using var cmd = new NpgsqlCommand(
            "SELECT extname FROM pg_extension WHERE extname='vector'", conn);
        var result = await cmd.ExecuteScalarAsync();
        Assert.Equal("vector", result as string);
    }

    [Fact]
    public void Solution_contains_exactly_one_api_project()
    {
        var root = FindRepoRoot();
        var srcDir = Path.Combine(root, "src");
        var csprojs = Directory.GetFiles(srcDir, "*.csproj", SearchOption.AllDirectories);
        Assert.Single(csprojs);
        Assert.Equal("RecallQ.Api.csproj", Path.GetFileName(csprojs[0]));
    }

    [Fact]
    public void No_forbidden_packages_are_referenced()
    {
        var root = FindRepoRoot();
        var forbidden = new[] { "MediatR", "AutoMapper", "Repository<", "UnitOfWork", "@ngrx" };
        var dirsToScan = new[] { "src", "web" };
        var extensions = new[] { ".cs", ".csproj", ".ts", ".json", ".html" };

        foreach (var dir in dirsToScan)
        {
            var full = Path.Combine(root, dir);
            if (!Directory.Exists(full)) continue;

            foreach (var file in Directory.EnumerateFiles(full, "*", SearchOption.AllDirectories))
            {
                if (file.Contains($"{Path.DirectorySeparatorChar}node_modules{Path.DirectorySeparatorChar}")) continue;
                if (file.Contains($"{Path.DirectorySeparatorChar}bin{Path.DirectorySeparatorChar}")) continue;
                if (file.Contains($"{Path.DirectorySeparatorChar}obj{Path.DirectorySeparatorChar}")) continue;
                if (file.Contains($"{Path.DirectorySeparatorChar}.angular{Path.DirectorySeparatorChar}")) continue;
                if (file.Contains($"{Path.DirectorySeparatorChar}dist{Path.DirectorySeparatorChar}")) continue;
                if (!extensions.Contains(Path.GetExtension(file))) continue;

                var content = File.ReadAllText(file);
                foreach (var token in forbidden)
                {
                    Assert.False(content.Contains(token),
                        $"Forbidden token '{token}' found in {file}");
                }
            }
        }
    }

    private static string FindRepoRoot()
    {
        var dir = new DirectoryInfo(AppContext.BaseDirectory);
        while (dir is not null && !File.Exists(Path.Combine(dir.FullName, "RecallQ.sln")))
            dir = dir.Parent;
        if (dir is null) throw new InvalidOperationException("Repo root not found");
        return dir.FullName;
    }
}
