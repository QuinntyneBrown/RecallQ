# POST /api/auth/register does not return 409 for duplicate email

**Status:** Incomplete
**Source:** Flow 01 - User Registration E2E tests
**Severity:** Medium (incorrect HTTP status code for duplicate email)

## Symptom

When attempting to register with an email that already exists, the POST `/api/auth/register` endpoint returns `400 Bad Request` instead of `409 Conflict`.

## Expected

Per flow 01, the registration endpoint should return `409 Conflict` when the email is already in use:
```
- **Email already in use** → `409 Conflict`, no user created.
```

## Actual

Response status: `400 Bad Request` (should be `409`)

## Repro

1. Register a user with email `test@example.com`
2. Attempt to register another user with the same email `test@example.com`
3. Observe 400 response instead of 409

## Notes

The endpoint needs to:
- Detect duplicate email in validation logic
- Return `409 Conflict` specifically for duplicate email
- Return `400 Bad Request` for other validation errors (weak password, invalid format, etc.)
- Not create a user if email already exists
