using System.Security.Claims;

namespace RecallQ.Api.Security;

public class CurrentUser : ICurrentUser
{
    public CurrentUser(IHttpContextAccessor accessor)
    {
        var principal = accessor.HttpContext?.User;
        if (principal?.Identity?.IsAuthenticated != true) return;
        var idClaim = principal.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (Guid.TryParse(idClaim, out var id)) UserId = id;
        Email = principal.FindFirst(ClaimTypes.Email)?.Value;
    }

    public Guid? UserId { get; }
    public string? Email { get; }
}
