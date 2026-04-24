using Prometheus;

namespace RecallQ.Api.Observability;

// Traces to: L2-070
// Task: T030
public static class RecallQMetrics
{
    public static readonly Histogram ApiLatencySeconds = Metrics.CreateHistogram(
        "recallq_api_latency_seconds",
        "API latency",
        new HistogramConfiguration { LabelNames = new[] { "endpoint" } });

    public static readonly Histogram EmbeddingLatencySeconds = Metrics.CreateHistogram(
        "recallq_embedding_latency_seconds",
        "Embedding latency");

    public static readonly Histogram SearchLatencySeconds = Metrics.CreateHistogram(
        "recallq_search_latency_seconds",
        "Search latency");

    public static readonly Counter LlmTokensTotal = Metrics.CreateCounter(
        "recallq_llm_tokens_total",
        "LLM tokens",
        new CounterConfiguration { LabelNames = new[] { "direction" } });

    public static readonly Counter LlmCostUsd = Metrics.CreateCounter(
        "recallq_llm_cost_usd",
        "LLM cost USD");
}
