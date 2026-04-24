using System.Globalization;
using CsvHelper;
using CsvHelper.Configuration;
using RecallQ.Api.Entities;

namespace RecallQ.Api.Endpoints;

public class ImportContactRow
{
    public string? DisplayName { get; set; }
    public string? Role { get; set; }
    public string? Organization { get; set; }
    public string? Emails { get; set; }
    public string? Phones { get; set; }
    public string? Tags { get; set; }
    public string? Location { get; set; }
}

public sealed class ImportContactRowMap : ClassMap<ImportContactRow>
{
    public ImportContactRowMap()
    {
        Map(m => m.DisplayName).Name("displayName", "DisplayName").Optional();
        Map(m => m.Role).Name("role", "Role").Optional();
        Map(m => m.Organization).Name("organization", "Organization").Optional();
        Map(m => m.Emails).Name("emails", "Emails").Optional();
        Map(m => m.Phones).Name("phones", "Phones").Optional();
        Map(m => m.Tags).Name("tags", "Tags").Optional();
        Map(m => m.Location).Name("location", "Location").Optional();
    }
}

public static class ImportContactsHelper
{
    public const int MaxRowLength = 2048;
    public const int BatchSize = 100;

    public static CsvConfiguration CsvConfig() => new(CultureInfo.InvariantCulture)
    {
        PrepareHeaderForMatch = args => args.Header.Trim().ToLowerInvariant(),
        HasHeaderRecord = true,
        MissingFieldFound = null,
        BadDataFound = null,
    };

    public static string[] Split(string? s) =>
        string.IsNullOrWhiteSpace(s)
            ? Array.Empty<string>()
            : s.Split(';', StringSplitOptions.RemoveEmptyEntries | StringSplitOptions.TrimEntries);

    public static string DeriveInitials(string displayName)
    {
        var parts = displayName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
        if (parts.Length == 0) return "?";
        if (parts.Length == 1) return parts[0][..Math.Min(2, parts[0].Length)].ToUpperInvariant();
        return (char.ToUpperInvariant(parts[0][0]).ToString() + char.ToUpperInvariant(parts[1][0])).ToUpperInvariant();
    }

    public static bool TryBuildContact(ImportContactRow row, Guid ownerId, out Contact? contact, out string? reason)
    {
        contact = null;
        var displayName = (row.DisplayName ?? string.Empty).Trim();
        if (displayName.Length < 1) { reason = "displayName is required"; return false; }
        if (displayName.Length > 120) { reason = "displayName must be 1-120 chars"; return false; }

        contact = new Contact
        {
            OwnerUserId = ownerId,
            DisplayName = displayName,
            Initials = DeriveInitials(displayName),
            Role = string.IsNullOrWhiteSpace(row.Role) ? null : row.Role.Trim(),
            Organization = string.IsNullOrWhiteSpace(row.Organization) ? null : row.Organization.Trim(),
            Location = string.IsNullOrWhiteSpace(row.Location) ? null : row.Location.Trim(),
            Tags = Split(row.Tags),
            Emails = Split(row.Emails),
            Phones = Split(row.Phones),
        };
        reason = null;
        return true;
    }
}
