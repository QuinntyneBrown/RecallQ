# `/contacts/:id/activity` renders a coming-soon stub

**Flow:** [12 — View Activity Timeline](../flows/12-view-activity-timeline/12-view-activity-timeline.md)
**Traces:** L1-003, L1-009, L2-011.
**Severity:** High — Flow 12's entire full-timeline view is unimplemented. The `See all N` link on the contact detail page routes to `/contacts/:id/activity`, and the user lands on a static page that reads only "All activity — coming soon".

## Observed

`frontend/src/app/pages/contact-detail/all-activity.page.ts`:

```ts
template: `
  <section class="page">
    <h1>All activity</h1>
    <p>All activity — coming soon</p>
  </section>
`,
```

No route param is read, no API is called, no timeline is rendered. `InteractionsService` also lacks a `list(contactId, page, pageSize)` method, so even if the page wanted to fetch data there's nothing to call.

## Expected

Per Flow 12 steps 1–5: the page should request page 1 of `/api/contacts/:id/interactions` with `pageSize=50`, render each row as the matching `Ix Email/Call/Meeting/Note` component, and append subsequent pages on scroll. A "No activity yet" empty state covers the zero-interactions alternative.

## Fix sketch

1. Add `InteractionsService.list(contactId: string, page = 1, pageSize = 50)` that calls `GET /api/contacts/:id/interactions?page=&pageSize=` and returns `{ items: InteractionDto[], nextPage: number | null }`.
2. Rewrite `AllActivityPage`:
   - Read `:id` from the route.
   - Fetch the first page in `ngOnInit`.
   - Render each item with `<app-timeline-item>` inside a `<ul role="list">`.
   - Show "No activity yet" when `items.length === 0`.
   - Keep infinite-scroll for a follow-up; first page is enough to unblock Flow 12.
