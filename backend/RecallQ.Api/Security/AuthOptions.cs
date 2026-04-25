using System.ComponentModel.DataAnnotations;

namespace RecallQ.Api.Security;

public class AuthOptions
{
    [Required]
    public string CookieName { get; set; } = "rq_auth";

    [Required]
    public string AppBaseUrl { get; set; } = "http://localhost:4200";

    [Required]
    public TimeSpan ResetTokenTtl { get; set; } = TimeSpan.FromHours(24);
}
