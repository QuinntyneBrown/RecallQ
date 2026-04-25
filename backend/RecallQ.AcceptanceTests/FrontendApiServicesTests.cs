namespace RecallQ.AcceptanceTests;

public class FrontendApiServicesTests
{
    [Fact]
    public void App_config_registers_http_client_with_interceptors()
    {
        var appConfigPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "../../../../../frontend/src/app/app.config.ts");

        Assert.True(File.Exists(appConfigPath), $"app.config.ts not found at {appConfigPath}");

        var content = File.ReadAllText(appConfigPath);

        Assert.Contains("provideHttpClient", content);
        Assert.Contains("withInterceptors", content);
    }

    [Fact]
    public void Services_use_http_client_instead_of_raw_fetch()
    {
        var servicesDir = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "../../../../../frontend/src/app");

        var serviceFiles = new[]
        {
            "contacts/contacts.service.ts",
            "auth/auth.service.ts",
            "interactions/interactions.service.ts",
            "search/search.service.ts",
            "imports/imports.service.ts",
            "intros/intros.service.ts",
            "stacks/stacks.service.ts",
            "suggestions/suggestions.service.ts",
            "health.service.ts",
        };

        foreach (var file in serviceFiles)
        {
            var filePath = Path.Combine(servicesDir, file);
            if (!File.Exists(filePath)) continue;

            var content = File.ReadAllText(filePath);

            // Services should use HttpClient for JSON API calls
            Assert.True(content.Contains("HttpClient"), $"{file} should use HttpClient for API calls");

            // Should not use raw fetch for normal JSON API calls
            // (ask.service.ts is an exception for streaming)
            if (!file.Contains("ask.service.ts"))
            {
                Assert.False(content.Contains("await fetch("), $"{file} should not use raw fetch for API calls");
            }
        }
    }

    [Fact]
    public void Api_interceptor_handles_401_not_global_fetch_monkey_patch()
    {
        var appConfigPath = Path.Combine(
            AppDomain.CurrentDomain.BaseDirectory,
            "../../../../../frontend/src/app/app.config.ts");

        var content = File.ReadAllText(appConfigPath);

        // Should NOT have global window.fetch replacement
        Assert.False(content.Contains("window.fetch"), "app.config.ts should not have global window.fetch replacement");
        Assert.False(content.Contains("installApiInterceptor"), "app.config.ts should not use installApiInterceptor");

        // Should use proper HTTP interceptor pattern
        Assert.Contains("withInterceptors", content);
    }
}
