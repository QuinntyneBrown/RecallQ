// Covers bug: docs/bugs/backend-build-broken-by-half-implemented-reset-password.md
// When the API project compiles cleanly, this test compiles and the
// factory boots. It exists to fail loudly if a future commit reintroduces
// dangling references in AuthEndpoints / AppDbContext / etc.
using System.Net;
using RecallQ.Api;

namespace RecallQ.AcceptanceTests;

public class BuildHealthTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public BuildHealthTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task WebApplicationFactory_boots_and_serves_ping()
    {
        // Touching a type from the API project proves the project compiled.
        // If anything references a missing type (entity, service, options),
        // the test project can't compile and this test never runs.
        var dbContextType = typeof(AppDbContext);
        Assert.NotNull(dbContextType);

        // The factory only stands up if the API host actually starts —
        // missing DI registrations or model-builder errors trip here.
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/ping");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }
}
