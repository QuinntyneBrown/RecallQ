using System.ComponentModel.DataAnnotations;

namespace RecallQ.Api.Security;

public class LlmOptions : IValidatableObject
{
    [Required]
    public string Provider { get; set; } = "fake";
    public string? ApiKey { get; set; }

    public IEnumerable<ValidationResult> Validate(ValidationContext validationContext)
    {
        if (string.Equals(Provider, "openai", StringComparison.OrdinalIgnoreCase)
            && string.IsNullOrWhiteSpace(ApiKey))
        {
            yield return new ValidationResult(
                "ApiKey is required when Llm:Provider is 'openai'.",
                new[] { nameof(ApiKey) });
        }
    }
}
