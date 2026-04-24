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
    public DbSet<Interaction> Interactions => Set<Interaction>();
    public DbSet<ContactEmbedding> ContactEmbeddings => Set<ContactEmbedding>();
    public DbSet<InteractionEmbedding> InteractionEmbeddings => Set<InteractionEmbedding>();
    public DbSet<BackfillCursor> BackfillCursors => Set<BackfillCursor>();
    public DbSet<RelationshipSummary> RelationshipSummaries => Set<RelationshipSummary>();
    public DbSet<Stack> Stacks => Set<Stack>();

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
        contact.Property(c => c.Starred).HasColumnName("starred").HasDefaultValue(false);
        contact.Property(c => c.CreatedAt).HasColumnName("created_at");
        contact.HasIndex(c => c.OwnerUserId);
        contact.HasQueryFilter(c => c.OwnerUserId == _currentUser.UserId);

        var interaction = builder.Entity<Interaction>();
        interaction.ToTable("interactions");
        interaction.HasKey(i => i.Id);
        interaction.Property(i => i.Id).HasColumnName("id");
        interaction.Property(i => i.ContactId).HasColumnName("contact_id");
        interaction.Property(i => i.OwnerUserId).HasColumnName("owner_user_id");
        interaction.Property(i => i.Type).HasColumnName("type").HasConversion<string>().IsRequired();
        interaction.Property(i => i.OccurredAt).HasColumnName("occurred_at");
        interaction.Property(i => i.Subject).HasColumnName("subject");
        interaction.Property(i => i.Content).HasColumnName("content").IsRequired();
        interaction.Property(i => i.CreatedAt).HasColumnName("created_at");
        interaction.HasIndex(i => new { i.OwnerUserId, i.ContactId, i.OccurredAt });
        interaction.HasOne<Contact>()
            .WithMany()
            .HasForeignKey(i => i.ContactId)
            .OnDelete(DeleteBehavior.Cascade);
        interaction.HasQueryFilter(i => i.OwnerUserId == _currentUser.UserId);

        var ce = builder.Entity<ContactEmbedding>();
        ce.ToTable("contact_embeddings");
        ce.HasKey(e => e.ContactId);
        ce.Property(e => e.ContactId).HasColumnName("contact_id");
        ce.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
        ce.Property(e => e.Model).HasColumnName("model").IsRequired();
        ce.Property(e => e.ContentHash).HasColumnName("content_hash").IsRequired();
        ce.Property(e => e.Embedding).HasColumnName("embedding").HasColumnType("vector(1536)");
        ce.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        ce.Property(e => e.Failed).HasColumnName("failed").HasDefaultValue(false);
        ce.Property(e => e.Attempts).HasColumnName("attempts").HasDefaultValue(0);
        ce.Property(e => e.LastError).HasColumnName("last_error");
        ce.HasIndex(e => e.OwnerUserId);
        ce.HasOne<Contact>()
            .WithOne()
            .HasForeignKey<ContactEmbedding>(e => e.ContactId)
            .OnDelete(DeleteBehavior.Cascade);
        ce.HasQueryFilter(e => e.OwnerUserId == _currentUser.UserId);

        var ie = builder.Entity<InteractionEmbedding>();
        ie.ToTable("interaction_embeddings");
        ie.HasKey(e => e.InteractionId);
        ie.Property(e => e.InteractionId).HasColumnName("interaction_id");
        ie.Property(e => e.OwnerUserId).HasColumnName("owner_user_id");
        ie.Property(e => e.Model).HasColumnName("model").IsRequired();
        ie.Property(e => e.ContentHash).HasColumnName("content_hash").IsRequired();
        ie.Property(e => e.Embedding).HasColumnName("embedding").HasColumnType("vector(1536)");
        ie.Property(e => e.UpdatedAt).HasColumnName("updated_at");
        ie.Property(e => e.Failed).HasColumnName("failed").HasDefaultValue(false);
        ie.Property(e => e.Attempts).HasColumnName("attempts").HasDefaultValue(0);
        ie.Property(e => e.LastError).HasColumnName("last_error");
        ie.HasIndex(e => e.OwnerUserId);
        ie.HasOne<Interaction>()
            .WithOne()
            .HasForeignKey<InteractionEmbedding>(e => e.InteractionId)
            .OnDelete(DeleteBehavior.Cascade);
        ie.HasQueryFilter(e => e.OwnerUserId == _currentUser.UserId);

        var bc = builder.Entity<BackfillCursor>();
        bc.ToTable("backfill_cursors");
        bc.HasKey(x => new { x.OwnerUserId, x.Table });
        bc.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
        bc.Property(x => x.Table).HasColumnName("table_name").HasMaxLength(32);
        bc.Property(x => x.LastProcessedCreatedAt).HasColumnName("last_processed_created_at");
        bc.Property(x => x.LastProcessedId).HasColumnName("last_processed_id");
        bc.Property(x => x.StartedAt).HasColumnName("started_at");
        bc.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        bc.Property(x => x.Completed).HasColumnName("completed").HasDefaultValue(false);

        var rs = builder.Entity<RelationshipSummary>();
        rs.ToTable("relationship_summaries");
        rs.HasKey(x => x.ContactId);
        rs.Property(x => x.ContactId).HasColumnName("contact_id");
        rs.Property(x => x.OwnerUserId).HasColumnName("owner_user_id");
        rs.Property(x => x.Paragraph).HasColumnName("paragraph");
        rs.Property(x => x.Sentiment).HasColumnName("sentiment").IsRequired();
        rs.Property(x => x.InteractionCount).HasColumnName("interaction_count");
        rs.Property(x => x.LastInteractionAt).HasColumnName("last_interaction_at");
        rs.Property(x => x.UpdatedAt).HasColumnName("updated_at");
        rs.Property(x => x.LastRefreshRequestedAt).HasColumnName("last_refresh_requested_at");
        rs.Property(x => x.Model).HasColumnName("model").IsRequired();
        rs.Property(x => x.SourceHash).HasColumnName("source_hash").IsRequired();
        rs.HasIndex(x => x.OwnerUserId);
        rs.HasOne<Contact>()
            .WithOne()
            .HasForeignKey<RelationshipSummary>(x => x.ContactId)
            .OnDelete(DeleteBehavior.Cascade);
        rs.HasQueryFilter(x => x.OwnerUserId == _currentUser.UserId);

        var stack = builder.Entity<Stack>();
        stack.ToTable("stacks");
        stack.HasKey(s => s.Id);
        stack.Property(s => s.Id).HasColumnName("id");
        stack.Property(s => s.OwnerUserId).HasColumnName("owner_user_id");
        stack.Property(s => s.Name).HasColumnName("name").IsRequired();
        stack.Property(s => s.Kind).HasColumnName("kind").HasConversion<string>().IsRequired();
        stack.Property(s => s.Definition).HasColumnName("definition").IsRequired();
        stack.Property(s => s.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
        stack.Property(s => s.CreatedAt).HasColumnName("created_at");
        stack.HasIndex(s => new { s.OwnerUserId, s.SortOrder });
        stack.HasQueryFilter(s => s.OwnerUserId == _currentUser.UserId);
    }
}
