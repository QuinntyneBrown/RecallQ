using System.ComponentModel.DataAnnotations;

namespace RecallQ.Api.Security;

public class DbOptions
{
    [Required]
    public string ConnectionString { get; set; } = "";
}
