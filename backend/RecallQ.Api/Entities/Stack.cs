namespace RecallQ.Api.Entities;

public enum StackKind
{
    Query,
    Tag,
    Classification,
}

public class Stack
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerUserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public StackKind Kind { get; set; }
    public string Definition { get; set; } = string.Empty;
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
