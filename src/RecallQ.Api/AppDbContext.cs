using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Entities;

namespace RecallQ.Api;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        var user = builder.Entity<User>();
        user.ToTable("users");
        user.HasKey(u => u.Id);
        user.Property(u => u.Id).HasColumnName("id");
        user.Property(u => u.Email).HasColumnName("email").IsRequired();
        user.Property(u => u.PasswordHash).HasColumnName("password_hash").IsRequired();
        user.Property(u => u.CreatedAt).HasColumnName("created_at");
        user.HasIndex(u => u.Email).IsUnique();
    }
}
