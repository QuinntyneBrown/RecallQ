using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Pgvector;

#nullable disable

namespace RecallQ.Api.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "backfill_cursors",
                columns: table => new
                {
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    table_name = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                    last_processed_created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_processed_id = table.Column<Guid>(type: "uuid", nullable: false),
                    started_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    completed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_backfill_cursors", x => new { x.owner_user_id, x.table_name });
                });

            migrationBuilder.CreateTable(
                name: "contacts",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    display_name = table.Column<string>(type: "text", nullable: false),
                    initials = table.Column<string>(type: "text", nullable: false),
                    role = table.Column<string>(type: "text", nullable: true),
                    organization = table.Column<string>(type: "text", nullable: true),
                    location = table.Column<string>(type: "text", nullable: true),
                    tags = table.Column<string[]>(type: "text[]", nullable: false),
                    emails = table.Column<string[]>(type: "text[]", nullable: false),
                    phones = table.Column<string[]>(type: "text[]", nullable: false),
                    avatar_color_a = table.Column<string>(type: "text", nullable: true),
                    avatar_color_b = table.Column<string>(type: "text", nullable: true),
                    starred = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contacts", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "stacks",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "text", nullable: false),
                    kind = table.Column<string>(type: "text", nullable: false),
                    definition = table.Column<string>(type: "text", nullable: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_stacks", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "suggestions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    key = table.Column<string>(type: "text", nullable: false),
                    kind = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "text", nullable: false),
                    body = table.Column<string>(type: "text", nullable: false),
                    action_label = table.Column<string>(type: "text", nullable: false),
                    action_href = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    dismissed_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_suggestions", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "users",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    email = table.Column<string>(type: "text", nullable: false),
                    password_hash = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    PasswordChangedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "contact_embeddings",
                columns: table => new
                {
                    contact_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    model = table.Column<string>(type: "text", nullable: false),
                    content_hash = table.Column<string>(type: "text", nullable: false),
                    embedding = table.Column<Vector>(type: "vector(1536)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    failed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_error = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contact_embeddings", x => x.contact_id);
                    table.ForeignKey(
                        name: "FK_contact_embeddings_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "interactions",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false),
                    contact_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    occurred_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    subject = table.Column<string>(type: "text", nullable: true),
                    content = table.Column<string>(type: "text", nullable: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_interactions", x => x.id);
                    table.ForeignKey(
                        name: "FK_interactions_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "relationship_summaries",
                columns: table => new
                {
                    contact_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    paragraph = table.Column<string>(type: "text", nullable: true),
                    sentiment = table.Column<string>(type: "text", nullable: false),
                    interaction_count = table.Column<int>(type: "integer", nullable: false),
                    last_interaction_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    last_refresh_requested_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    model = table.Column<string>(type: "text", nullable: false),
                    source_hash = table.Column<string>(type: "text", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_relationship_summaries", x => x.contact_id);
                    table.ForeignKey(
                        name: "FK_relationship_summaries_contacts_contact_id",
                        column: x => x.contact_id,
                        principalTable: "contacts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "interaction_embeddings",
                columns: table => new
                {
                    interaction_id = table.Column<Guid>(type: "uuid", nullable: false),
                    owner_user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    model = table.Column<string>(type: "text", nullable: false),
                    content_hash = table.Column<string>(type: "text", nullable: false),
                    embedding = table.Column<Vector>(type: "vector(1536)", nullable: false),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    failed = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    attempts = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    last_error = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_interaction_embeddings", x => x.interaction_id);
                    table.ForeignKey(
                        name: "FK_interaction_embeddings_interactions_interaction_id",
                        column: x => x.interaction_id,
                        principalTable: "interactions",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_contact_embeddings_owner_user_id",
                table: "contact_embeddings",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_contacts_owner_user_id",
                table: "contacts",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_interaction_embeddings_owner_user_id",
                table: "interaction_embeddings",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_interactions_contact_id",
                table: "interactions",
                column: "contact_id");

            migrationBuilder.CreateIndex(
                name: "IX_interactions_owner_user_id_contact_id_occurred_at",
                table: "interactions",
                columns: new[] { "owner_user_id", "contact_id", "occurred_at" });

            migrationBuilder.CreateIndex(
                name: "IX_relationship_summaries_owner_user_id",
                table: "relationship_summaries",
                column: "owner_user_id");

            migrationBuilder.CreateIndex(
                name: "IX_stacks_owner_user_id_sort_order",
                table: "stacks",
                columns: new[] { "owner_user_id", "sort_order" });

            migrationBuilder.CreateIndex(
                name: "IX_suggestions_owner_user_id_key",
                table: "suggestions",
                columns: new[] { "owner_user_id", "key" });

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                table: "users",
                column: "email",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "backfill_cursors");

            migrationBuilder.DropTable(
                name: "contact_embeddings");

            migrationBuilder.DropTable(
                name: "interaction_embeddings");

            migrationBuilder.DropTable(
                name: "relationship_summaries");

            migrationBuilder.DropTable(
                name: "stacks");

            migrationBuilder.DropTable(
                name: "suggestions");

            migrationBuilder.DropTable(
                name: "users");

            migrationBuilder.DropTable(
                name: "interactions");

            migrationBuilder.DropTable(
                name: "contacts");
        }
    }
}
