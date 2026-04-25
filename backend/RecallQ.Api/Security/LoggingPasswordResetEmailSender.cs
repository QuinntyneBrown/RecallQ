using Microsoft.Extensions.Options;

namespace RecallQ.Api.Security;

public sealed class LoggingPasswordResetEmailSender : IPasswordResetEmailSender
{
    private readonly IOptions<AuthOptions> _options;
    private readonly ILogger<LoggingPasswordResetEmailSender> _logger;

    public LoggingPasswordResetEmailSender(IOptions<AuthOptions> options, ILogger<LoggingPasswordResetEmailSender> logger)
    {
        _options = options;
        _logger = logger;
    }

    public Task SendAsync(string email, string rawToken, TimeSpan ttl, CancellationToken ct)
    {
        _ = rawToken;
        var resetUrlWithoutToken = $"{_options.Value.AppBaseUrl.TrimEnd('/')}/reset-password?token=";
        _logger.LogInformation(
            "Password reset email prepared for {EmailDomain}. link_present={LinkPresent} ttl_minutes={TtlMinutes} contains_password={ContainsPassword} reset_url={ResetUrl}",
            RedactEmail(email),
            true,
            (int)Math.Ceiling(ttl.TotalMinutes),
            false,
            resetUrlWithoutToken);
        return Task.CompletedTask;
    }

    private static string RedactEmail(string email)
    {
        var at = email.IndexOf('@');
        return at >= 0 && at < email.Length - 1 ? $"*@{email[(at + 1)..]}" : "*";
    }
}
