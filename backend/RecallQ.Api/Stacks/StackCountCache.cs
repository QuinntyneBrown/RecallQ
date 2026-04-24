using System.Collections.Concurrent;

namespace RecallQ.Api.Stacks;

public class StackCountCacheOptions
{
    public TimeSpan Ttl { get; set; } = TimeSpan.FromMinutes(5);
}

public class StackCountCache
{
    private readonly ConcurrentDictionary<(Guid userId, Guid stackId), (DateTime Expires, int Count)> _map = new();
    private readonly StackCountCacheOptions _options;

    public StackCountCache(StackCountCacheOptions options)
    {
        _options = options;
    }

    public TimeSpan Ttl => _options.Ttl;

    public bool TryGet((Guid userId, Guid stackId) key, out int count)
    {
        if (_map.TryGetValue(key, out var v) && v.Expires > DateTime.UtcNow)
        {
            count = v.Count;
            return true;
        }
        count = 0;
        return false;
    }

    public void Set((Guid userId, Guid stackId) key, int count)
    {
        _map[key] = (DateTime.UtcNow.Add(_options.Ttl), count);
    }

    public void InvalidateOwner(Guid userId)
    {
        foreach (var k in _map.Keys.Where(k => k.userId == userId).ToList())
            _map.TryRemove(k, out _);
    }
}
