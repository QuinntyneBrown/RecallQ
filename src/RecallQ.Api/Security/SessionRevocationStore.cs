using System.Collections.Concurrent;

namespace RecallQ.Api.Security;

public class SessionRevocationStore
{
    private readonly ConcurrentDictionary<Guid, DateTime> _revoked = new();

    public void Revoke(Guid sessionId) => _revoked[sessionId] = DateTime.UtcNow;

    public bool IsRevoked(Guid sessionId) => _revoked.ContainsKey(sessionId);
}
