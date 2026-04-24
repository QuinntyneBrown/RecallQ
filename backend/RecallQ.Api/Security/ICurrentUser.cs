namespace RecallQ.Api.Security;

public interface ICurrentUser
{
    Guid? UserId { get; }
    string? Email { get; }
}
