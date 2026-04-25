# GET /api/contacts sort by name does not return contacts in alphabetical order

**Status:** Incomplete
**Source:** Flow 06 - List Contacts E2E tests
**Severity:** High (user cannot sort contacts by name as expected)

## Symptom

When requesting `/api/contacts?sort=name`, the contacts are not returned in alphabetical order by displayName.

Test creates contacts with names: `['zebra', 'apple', 'mango', 'banana']`
Expected order: `['apple', 'banana', 'mango', 'zebra']`
Actual order: `['banana', 'mango', 'apple', 'zebra']`

## Expected

`GET /api/contacts?page=1&pageSize=50&sort=name` returns contacts ordered alphabetically by displayName (case-insensitive).

## Actual

The endpoint returns contacts in a different order (possibly by creation order or last interaction).

## Repro

1. Create contacts with names: zebra, apple, mango, banana (in that order)
2. GET `/api/contacts?page=1&pageSize=50&sort=name`
3. Observe contacts are NOT in alphabetical order

## Notes

The sort implementation likely has:
- Missing case-insensitive handling
- Wrong field being sorted
- Incorrect sort direction
- Or the sort parameter is not being applied

Check ContactsEndpoints.cs GET handler to verify sort=name is correctly applying alphabetical ordering by displayName.
