using System.Text.Json;
using System.Text.RegularExpressions;

namespace RecallQ.Api.Chat;

public class FollowUpGenerator
{
    private const string SystemPrompt = "You produce up to 3 short follow-up questions a user might ask next. Respond with a JSON array of 0-3 strings.";
    private readonly IChatClient _chat;
    private readonly ILogger<FollowUpGenerator> _logger;

    public FollowUpGenerator(IChatClient chat, ILogger<FollowUpGenerator> logger)
    {
        _chat = chat;
        _logger = logger;
    }

    public async Task<IReadOnlyList<string>> GenerateAsync(string question, string answer, CancellationToken ct)
    {
        try
        {
            var a = answer.Length > 200 ? answer[..200] : answer;
            var messages = new List<ChatMessage>
            {
                new("system", SystemPrompt),
                new("user", $"Q: {question}\nA: {a}\nFollow-ups:"),
            };
            var raw = await _chat.CompleteAsync(messages, ct);
            var parsed = Parse(raw);
            _logger.LogInformation("followup_generated count={count}", parsed.Count);
            return parsed;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "followup_generation_failed");
            return Array.Empty<string>();
        }
    }

    private static IReadOnlyList<string> Parse(string raw)
    {
        if (string.IsNullOrWhiteSpace(raw)) return Array.Empty<string>();
        string[]? arr = null;
        try { arr = JsonSerializer.Deserialize<string[]>(raw); }
        catch { /* fallthrough */ }
        if (arr is null)
        {
            var m = Regex.Match(raw, @"\[.*?\]", RegexOptions.Singleline);
            if (m.Success)
            {
                try { arr = JsonSerializer.Deserialize<string[]>(m.Value); }
                catch { arr = null; }
            }
        }
        if (arr is null) return Array.Empty<string>();
        return arr
            .Where(s => !string.IsNullOrWhiteSpace(s))
            .Select(s => s.Trim())
            .Take(3)
            .ToArray();
    }
}
