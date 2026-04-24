using System.Text.Json;
using System.Text.RegularExpressions;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Chat;

public class IntroDraftGenerator
{
    private const string SystemPrompt =
        "You write concise professional email intros. Respond ONLY as JSON: {\"subject\":\"...\",\"body\":\"...\"}. Body <= 1500 chars. No markdown.";

    private readonly IChatClient _chat;
    private readonly ILogger<IntroDraftGenerator> _logger;

    public IntroDraftGenerator(IChatClient chat, ILogger<IntroDraftGenerator> logger)
    {
        _chat = chat;
        _logger = logger;
    }

    public async Task<(string Subject, string Body)> GenerateAsync(Contact a, Contact b, CancellationToken ct)
    {
        var userMessage = BuildUserMessage(a, b);
        try
        {
            var messages = new List<ChatMessage>
            {
                new("system", SystemPrompt),
                new("user", userMessage),
            };
            var raw = await _chat.CompleteAsync(messages, ct);
            if (TryParse(raw, out var subject, out var body))
            {
                body = Truncate(body, 1500);
                _logger.LogInformation("intro_draft_generated subject_len={sl} body_len={bl}", subject.Length, body.Length);
                return (subject, body);
            }
            _logger.LogWarning("intro_draft_parse_failed raw_len={l}", raw?.Length ?? 0);
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "intro_draft_generation_failed");
        }
        return Fallback(a, b);
    }

    private static string BuildUserMessage(Contact a, Contact b)
    {
        string Field(string? s) => Cap(s ?? "", 80);
        string Tags(string[] t) => string.Join(", ", t.Take(3).Select(x => Cap(x, 80)));
        var text =
            $"Contact A: name={Field(a.DisplayName)}; role={Field(a.Role)}; org={Field(a.Organization)}; tags=[{Tags(a.Tags ?? Array.Empty<string>())}]\n" +
            $"Contact B: name={Field(b.DisplayName)}; role={Field(b.Role)}; org={Field(b.Organization)}; tags=[{Tags(b.Tags ?? Array.Empty<string>())}]\n" +
            "Write an intro email connecting A and B.";
        return Cap(text, 1500);
    }

    private static string Cap(string s, int n) => s.Length <= n ? s : s[..n];

    private static bool TryParse(string raw, out string subject, out string body)
    {
        subject = ""; body = "";
        if (string.IsNullOrWhiteSpace(raw)) return false;
        if (TryDeserialize(raw, out subject, out body)) return true;
        var m = Regex.Match(raw, @"\{[\s\S]*\}");
        if (m.Success && TryDeserialize(m.Value, out subject, out body)) return true;
        return false;
    }

    private static bool TryDeserialize(string json, out string subject, out string body)
    {
        subject = ""; body = "";
        try
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.ValueKind != JsonValueKind.Object) return false;
            if (doc.RootElement.TryGetProperty("subject", out var s) && s.ValueKind == JsonValueKind.String)
                subject = s.GetString() ?? "";
            if (doc.RootElement.TryGetProperty("body", out var b) && b.ValueKind == JsonValueKind.String)
                body = b.GetString() ?? "";
            return !string.IsNullOrWhiteSpace(subject) && !string.IsNullOrWhiteSpace(body);
        }
        catch { return false; }
    }

    private static (string, string) Fallback(Contact a, Contact b) =>
        ($"Introducing {a.DisplayName} and {b.DisplayName}",
         $"Hi — wanted to introduce {a.DisplayName} and {b.DisplayName}. I think you two would benefit from connecting. I'll let you take it from here.");

    private static string Truncate(string s, int max)
    {
        if (s.Length <= max) return s;
        var cut = s[..max];
        var sp = cut.LastIndexOf(' ');
        if (sp > 0 && sp > max - 40) cut = cut[..sp];
        return cut + "…";
    }
}
