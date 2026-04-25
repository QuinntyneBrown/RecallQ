# GET /api/contacts response missing interactionTotal, lastInteraction, and starred fields

**Status:** Complete
**Source:** Flow 06 - List Contacts E2E tests
**Severity:** High (list view cannot display complete contact information)

## Symptom

The `/api/contacts` list endpoint returns contact objects that are missing fields needed for the contacts list UI:
- `interactionTotal`
- `lastInteraction`
- `starred`

The response appears to be returning contact detail fields only (displayName, role, organization, etc.) without the interaction tracking fields needed for list display.

## Expected

Per flow 06, the list response should include:
```json
{
  "items": [{
    "id": "...",
    "displayName": "...",
    "initials": "...",
    "interactionTotal": 0,
    "lastInteraction": null,
    "starred": false
  }],
  "totalCount": 1,
  "nextPage": null
}
```

## Actual

Response only includes:
```json
{
  "items": [{
    "id": "...",
    "displayName": "...",
    "initials": "...",
    "avatarColorA": null,
    "avatarColorB": null,
    "emails": [],
    "location": null,
    "organization": null,
    "phones": [],
    "role": null,
    "tags": []
  }],
  "totalCount": 1,
  "nextPage": null
}
```

## Repro

1. Create a contact
2. GET `/api/contacts?page=1&pageSize=50&sort=recent`
3. Verify the response JSON includes all required fields

## Notes

The list endpoint is likely returning ContactDetailDto instead of ContactDto (a list-specific DTO). Check if:
- A ContactListDto or ContactDto exists
- The endpoint mapping is using the correct DTO
- The DTO includes computed fields like interactionTotal and lastInteraction
