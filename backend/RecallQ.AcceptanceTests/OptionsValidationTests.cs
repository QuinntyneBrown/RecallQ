// Traces to: L2-058
// Task: T029
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;

namespace RecallQ.AcceptanceTests;

public class OptionsValidationTests
{
    [Fact]
    public void Missing_LLM_API_KEY_fails_fast_at_startup()
    {
        using var factory = new WebApplicationFactory<Program>()
            .WithWebHostBuilder(b =>
            {
                b.ConfigureAppConfiguration((_, cfg) =>
                {
                    cfg.AddInMemoryCollection(new Dictionary<string, string?>
                    {
                        ["Llm:Provider"] = "openai",
                        ["Llm:ApiKey"] = null,
                    });
                });
            });

        var ex = Assert.ThrowsAny<Exception>(() => factory.CreateClient());
        var flattened = Flatten(ex);
        Assert.True(
            flattened.Contains("ApiKey", StringComparison.OrdinalIgnoreCase)
            || flattened.Contains("required", StringComparison.OrdinalIgnoreCase),
            $"Expected validation failure for ApiKey; got: {flattened}");
    }

    private static string Flatten(Exception ex)
    {
        var msgs = new List<string>();
        for (var e = ex; e is not null; e = e.InnerException) msgs.Add(e.Message);
        return string.Join(" | ", msgs);
    }
}
