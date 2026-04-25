# Contact detail has no "Log interaction" button

**Status:** Complete — a `+ Log` button is now rendered in the Recent activity header; `onLogInteraction()` routes to `/contacts/:id/interactions/new`.
**Flow:** [11 — Log Interaction](../flows/11-log-interaction/11-log-interaction.md)
**Traces:** L1-003, L2-010.
**Severity:** High — Flow 11's primary user trigger ("User taps **Log interaction** on a contact detail screen…") has no UI entry point. The `/contacts/:id/interactions/new` route exists and `AddInteractionPage` is fully implemented, but a visitor on the contact detail page has no button or link that navigates there, so the only way in is to type the URL.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.ts` renders hero chrome, timeline, summary, quick actions (Message/Call/Intro), and links to `'See all N'` activity — but nothing targeting `/contacts/:id/interactions/new`. A grep of `frontend/src/app/**` for `interactions/new` finds the route in `app.routes.ts` and the API path in `InteractionsService.create`; no template references it.

## Expected

Flow 11's trigger places a **Log interaction** action on the contact detail screen. Tapping it routes to `/contacts/:id/interactions/new` where `AddInteractionPage` is already wired.

## Fix sketch

Add a visible **Log interaction** button to `contact-detail.page.ts` — most naturally next to the existing Message / Call / Intro quick-action tiles — whose `(click)` handler navigates to `['/contacts', c.id, 'interactions', 'new']`. No new page or service work needed.
