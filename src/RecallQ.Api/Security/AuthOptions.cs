using System.ComponentModel.DataAnnotations;

namespace RecallQ.Api.Security;

public class AuthOptions
{
    [Required]
    public string CookieName { get; set; } = "rq_auth";
}
