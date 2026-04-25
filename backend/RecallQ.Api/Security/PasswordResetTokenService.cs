using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Security;

public sealed record ResetTokenIssue(string RawToken, DateTime ExpiresAt);

public sealed class PasswordResetTokenService
{
    private readonly AppDbContext _db;
    private readonly IOptions<AuthOptions> _options;
    private readonly TimeProvider _clock;

    public PasswordResetTokenService(AppDbContext db, IOptions<AuthOptions> options, TimeProvider clock)
    {
        _db = db;
        _options = options;
        _clock = clock;
    }

    public ResetTokenIssue Issue(Guid userId)
    {
        _ = userId;
        var raw = Base64UrlEncode(RandomNumberGenerator.GetBytes(32));
        var expiresAt = _clock.GetUtcNow().UtcDateTime.Add(_options.Value.ResetTokenTtl);
        return new ResetTokenIssue(raw, expiresAt);
    }

    public string Hash(string rawToken)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(rawToken));
        return Convert.ToHexString(bytes).ToLowerInvariant();
    }

    public async Task PersistAsync(Guid userId, string tokenHash, DateTime expiresAt, CancellationToken ct)
    {
        _db.PasswordResetTokens.Add(new PasswordResetToken
        {
            OwnerUserId = userId,
            TokenHash = tokenHash,
            ExpiresAt = expiresAt,
            CreatedAt = _clock.GetUtcNow().UtcDateTime
        });
        await _db.SaveChangesAsync(ct);
    }

    private static string Base64UrlEncode(byte[] bytes)
    {
        return Convert.ToBase64String(bytes)
            .TrimEnd('=')
            .Replace('+', '-')
            .Replace('/', '_');
    }
}
