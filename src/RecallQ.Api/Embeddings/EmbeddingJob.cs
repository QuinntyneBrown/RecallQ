namespace RecallQ.Api.Embeddings;

public record EmbeddingJob(Guid Id, Guid OwnerUserId, string Kind = "contact");
