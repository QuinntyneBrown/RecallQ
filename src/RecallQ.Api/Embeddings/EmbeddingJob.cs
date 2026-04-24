namespace RecallQ.Api.Embeddings;

public record EmbeddingJob(Guid ContactId, Guid OwnerUserId, string Kind = "contact");
