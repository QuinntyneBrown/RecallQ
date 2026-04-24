// Traces to: L2-072
// Task: T004
namespace RecallQ.AcceptanceTests;

public class PingTests : IClassFixture<RecallqFactory>
{
    private readonly RecallqFactory _factory;

    public PingTests(RecallqFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task Get_api_ping_returns_200_pong()
    {
        var client = _factory.CreateClient();
        var response = await client.GetAsync("/api/ping");
        Assert.Equal(System.Net.HttpStatusCode.OK, response.StatusCode);
        var body = await response.Content.ReadAsStringAsync();
        Assert.Equal("pong", body);
    }
}
