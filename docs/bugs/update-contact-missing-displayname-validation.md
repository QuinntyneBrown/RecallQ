# PATCH /api/contacts does not validate displayName length

**Status:** Incomplete
**Source:** Flow 08 - Update Contact E2E tests
**Severity:** Medium (inconsistent validation between create and update)

## Symptom

When updating a contact with `displayName` > 120 characters, the PATCH endpoint returns `200 OK` instead of `400 Bad Request`.

The POST endpoint (create contact) correctly validates displayName length (1-120 chars), but the PATCH endpoint does not.

## Expected

Per flow 08, the PATCH endpoint should validate all fields the same way the POST endpoint does:
- `displayName` must be 1-120 characters
- Returns `400 Bad Request` with validation errors if constraints violated
- No changes are persisted on validation failure

## Actual

Response status: `200 OK` (should be `400`)
Contact displayName is updated to the invalid value

## Repro

1. Create a contact
2. PATCH with `displayName: "aaa...aaa"` (121+ characters)
3. Observe 200 response instead of 400

## Notes

The PATCH endpoint needs to:
- Validate displayName length (1-120)
- Validate initials length (1-3) if provided
- Trim whitespace before validation
- Return 400 with field-specific error messages
- Not persist changes if validation fails
