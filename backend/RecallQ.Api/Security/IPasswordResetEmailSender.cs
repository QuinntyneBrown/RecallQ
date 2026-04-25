namespace RecallQ.Api.Security;

public interface IPasswordResetEmailSender
{
    Task SendAsync(string email, string rawToken, TimeSpan ttl, CancellationToken ct);
}
