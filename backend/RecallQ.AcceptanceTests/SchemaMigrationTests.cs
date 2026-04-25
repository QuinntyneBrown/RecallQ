using System.Diagnostics.CodeAnalysis;

namespace RecallQ.AcceptanceTests;

public class SchemaMigrationTests
{
    [Fact]
    [SuppressMessage("Usage", "CA1806:Do not ignore method results", Justification = "Testing")]
    public void Schema_creation_must_use_migrations_not_ensure_created()
    {
        // This test verifies that the codebase uses EF Core Migrations for schema management,
        // not EnsureCreatedAsync which hides migration drift and fails with poor error messaging.

        var apiProjectPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "../../../../RecallQ.Api/Program.cs");

        Assert.True(File.Exists(apiProjectPath), $"Program.cs not found at {apiProjectPath}");

        var programContent = File.ReadAllText(apiProjectPath);

        // EnsureCreatedAsync is a development convenience that should not be used in production code
        Assert.DoesNotContain("EnsureCreatedAsync", programContent);

        // Verify migrations directory exists
        var migrationsPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "../../../../RecallQ.Api/Migrations");

        Assert.True(Directory.Exists(migrationsPath) && Directory.EnumerateFiles(migrationsPath, "*.cs").Any(),
            "EF Core Migrations directory should exist with migration files");
    }

    [Fact]
    public void Production_startup_should_fail_fast_on_schema_errors()
    {
        var apiProjectPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "../../../../RecallQ.Api/Program.cs");

        var programContent = File.ReadAllText(apiProjectPath);

        // Should not catch schema initialization errors silently
        // In production, schema init failures should propagate as startup errors
        var hasExceptionHandling = programContent.Contains("catch") &&
                                  programContent.Contains("Database.ExecuteSqlRawAsync");

        // If there are try-catch blocks around schema setup, they should not silently log and continue
        if (hasExceptionHandling)
        {
            Assert.DoesNotContain("catch (Exception", programContent);
        }
    }
}
