# Timeline has no edit-interaction affordance

**Flow:** 13 — Update Interaction
**Severity:** High
**Status:** Complete — `timeline-item` now renders an `Edit interaction` pencil button next to the trash button; both `contact-detail.page` and `all-activity.page` wire the `(edit)` output to a new route `contacts/:id/interactions/:interactionId/edit`; `EditInteractionPage` reads the contact, prefills the form from `recentInteractions`, and PATCHes via `InteractionsService.patch` on save.

## Symptom

Flow 13 says "User taps an interaction in the timeline, opens edit, changes
fields, and saves." The backend has the full PATCH pipeline
(`InteractionsEndpoints.MapPatch`, re-embed + summary-refresh enqueues,
acceptance tests in `InteractionsTests.Patch_interaction_re_enqueues_embedding`),
and the SPA has the call (`InteractionsService.patch`), but **nothing in the
UI ever invokes it**:

- `timeline-item.component.html` only renders a Delete button — no Edit
  button, no clickable body.
- No `contacts/:id/interactions/:interactionId/edit` route in
  `app.routes.ts`.
- No edit-interaction page anywhere in `frontend/src/app/pages`.

Result: a user who mistypes an interaction's subject or content has no way to
correct it short of deleting and re-creating, which loses the original
`occurredAt`/`createdAt` and is a poor UX for the central "log the world"
feature of the app.

## Expected

From a contact's timeline (or the All Activity page), each interaction row
exposes an Edit affordance. Activating it routes to an edit page (or opens an
inline editor) that loads the existing values, lets the user change
`subject`/`content`/`type`/`occurredAt`, and PATCHes the row. On success the
timeline shows the new values.

## Actual

No edit entry point exists. `InteractionsService.patch` is dead code from the
SPA's perspective.

## Repro

1. Log in.
2. Open any contact with at least one logged interaction.
3. Inspect the timeline rows: only a trash button is present.
4. There is no `/contacts/:id/interactions/:interactionId/edit` route.

## Notes

The radically simple fix:

- Add an `Edit interaction` button to `timeline-item.component.html` that
  emits `(edit)` with the interaction id.
- Add a route `contacts/:id/interactions/:interactionId/edit` that loads an
  `EditInteractionPage` mirroring `AddInteractionPage` but pre-filled from
  the existing interaction and calling `interactions.patch` on submit.
- Wire `contact-detail.page` and `all-activity.page` to route on `(edit)`.
