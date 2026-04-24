namespace RecallQ.Api.Entities;

public class Contact
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public Guid OwnerUserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Initials { get; set; } = string.Empty;
    public string? Role { get; set; }
    public string? Organization { get; set; }
    public string? Location { get; set; }
    public string[] Tags { get; set; } = Array.Empty<string>();
    public string[] Emails { get; set; } = Array.Empty<string>();
    public string[] Phones { get; set; } = Array.Empty<string>();
    public string? AvatarColorA { get; set; }
    public string? AvatarColorB { get; set; }
    public bool Starred { get; set; } = false;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
