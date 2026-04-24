namespace RecallQ.Api.Entities;

public class Suggestion
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerUserId { get; set; }
    public string Key { get; set; } = string.Empty;
    public string Kind { get; set; } = string.Empty;
    public string Title { get; set; } = string.Empty;
    public string Body { get; set; } = string.Empty;
    public string ActionLabel { get; set; } = string.Empty;
    public string ActionHref { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime? DismissedAt { get; set; }
}
