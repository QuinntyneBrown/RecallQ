using Pgvector;

namespace RecallQ.Api.Entities;

public class ContactEmbedding
{
    public Guid ContactId { get; set; }
    public Guid OwnerUserId { get; set; }
    public string Model { get; set; } = string.Empty;
    public string ContentHash { get; set; } = string.Empty;
    public Vector Embedding { get; set; } = new Vector(new float[1536]);
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
    public bool Failed { get; set; } = false;
    public int Attempts { get; set; } = 0;
    public string? LastError { get; set; }
}
