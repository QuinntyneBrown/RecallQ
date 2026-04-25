# POST /api/contacts does not set default avatar colors when not provided

**Status:** Incomplete
**Source:** Flow 05 - Create Contact E2E tests
**Severity:** High (missing UI feature for contact display)

## Symptom

When creating a contact without providing `avatarColorA` or `avatarColorB`, the API returns `null` for both fields instead of selecting default colors from a palette.

## Expected

Per flow 05, the server should set default avatar colors from a palette when `avatarColorA` and/or `avatarColorB` are not supplied in the request.

```json
{
  "displayName": "Test",
  "initials": "T"
  // avatarColorA and avatarColorB not provided
}

// Should return:
{
  "id": "...",
  "avatarColorA": "#FF6B6B",  // default color
  "avatarColorB": "#4ECDC4",  // default color
  ...
}
```

## Actual

Response returns `null` for both avatar colors:

```json
{
  "id": "...",
  "avatarColorA": null,
  "avatarColorB": null,
  ...
}
```

## Repro

1. POST `/api/contacts` without `avatarColorA` or `avatarColorB`
2. Observe both fields are `null` in response

## Notes

The endpoint needs to:
- Define a palette of default avatar colors
- When `avatarColorA` is not provided, select a color from the palette (possibly based on contact name hash for consistency)
- When `avatarColorB` is not provided, select a complementary color
- Return the selected colors in the response
