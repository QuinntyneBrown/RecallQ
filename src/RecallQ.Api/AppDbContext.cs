using Microsoft.EntityFrameworkCore;
using RecallQ.Api.Entities;
using RecallQ.Api.Security;

namespace RecallQ.Api;

public class AppDbContext : DbContext
{
    private readonly ICurrentUser _currentUser;

    public AppDbContext(DbContextOptions<AppDbContext> options, ICurrentUser currentUser) : base(options)
    {
        _currentUser = currentUser;
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Contact> Contacts => Set<Contact>();

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

        var contact = builder.Entity<Contact>();
        contact.ToTable("contacts");
        contact.HasKey(c => c.Id);
        contact.Property(c => c.Id).HasColumnName("id");
        contact.Property(c => c.OwnerUserId).HasColumnName("owner_user_id");
        contact.Property(c => c.DisplayName).HasColumnName("display_name").IsRequired();
        contact.Property(c => c.Initials).HasColumnName("initials").IsRequired();
        contact.Property(c => c.Role).HasColumnName("role");
        contact.Property(c => c.Organization).HasColumnName("organization");
        contact.Property(c => c.Location).HasColumnName("location");
        contact.Property(c => c.Tags).HasColumnName("tags");
        contact.Property(c => c.Emails).HasColumnName("emails");
        contact.Property(c => c.Phones).HasColumnName("phones");
        contact.Property(c => c.AvatarColorA).HasColumnName("avatar_color_a");
        contact.Property(c => c.AvatarColorB).HasColumnName("avatar_color_b");
        contact.Property(c => c.CreatedAt).HasColumnName("created_at");
        contact.HasIndex(c => c.OwnerUserId);
        contact.HasQueryFilter(c => c.OwnerUserId == _currentUser.UserId);
    }
}
