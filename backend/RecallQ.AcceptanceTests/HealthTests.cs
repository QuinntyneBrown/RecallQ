// Traces to: L2-072
// Task: T004
namespace RecallQ.AcceptanceTests;

public class HealthTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public HealthTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_health_returns_200_when_db_is_up()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/health");
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
    }
}
