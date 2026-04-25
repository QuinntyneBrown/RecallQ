# Manual refresh wipes the visible relationship summary

**Flow:** 27 — Refresh Relationship Summary (Manual)
**Severity:** Medium-High (UX regression)
**Status:** Complete — `ContactDetailPage` now exposes a `refreshing` signal; `onRefreshSummary` no longer overwrites the summary to `pending` and `loadSummary` only replaces a `ready` summary with a `pending` poll response when no ready content exists. `relationship-summary-card` accepts `[refreshing]`, sets `aria-busy="true"` on the card, disables the refresh button, and spins the icon (respecting `prefers-reduced-motion`).

## Symptom

`ContactDetailPage.onRefreshSummary` sets the summary signal back to
`{ status: 'pending' }` before kicking off the refresh:

```ts
async onRefreshSummary() {
  const id = this.contactId();
  if (!id) return;
  this.summary.set({ status: 'pending' });   // <— wipes paragraph + stats
  try { await this.contacts.refreshSummary(id); } catch (e: any) { … }
  this.loadSummary(0);
}
```

The relationship-summary-card template renders the pending branch as a
prominent "Generating summary…" skeleton instead of the paragraph +
stats. So the user taps `Refresh` to *check on* the summary and the
paragraph they were reading disappears for the entire poll window
(up to 15 s, per flow 26).

Per flow 27 step 5:

> The SPA shows a **subtle** loading affordance on the card and
> begins polling `/summary` every 1.5 s (max 15 s) per flow 26.

And the worker-failure alternative:

> stale summary stays visible with a `stale` marker

The intent is that the existing paragraph **stays visible** during a
manual refresh; only a small indicator on the card signals that work
is in flight.

## Expected

- Tapping `Refresh` keeps the current paragraph + stats visible.
- The card surfaces a subtle "refreshing" state (e.g., the refresh
  icon spins, `aria-busy="true"` on the card) while the regeneration
  runs.
- Once the new summary lands, the paragraph updates in place.

## Actual

- Tapping `Refresh` replaces the paragraph + stats with the
  "Generating summary…" skeleton until the poll resolves.

## Repro

1. Open any contact whose summary status is `ready` so a paragraph
   is rendered.
2. Tap the refresh icon on the summary card.
3. Observe: the paragraph and stats disappear; the card shows
   "Generating summary…" instead.

## Notes

Radically simple fix:

- Add a `refreshing` signal on `ContactDetailPage`.
- Set it to `true` at the start of `onRefreshSummary` and back to
  `false` when polling finishes.
- Stop calling `this.summary.set({ status: 'pending' })` so the
  existing summary stays in place.
- Pass the boolean down to the card as an `[refreshing]` input;
  card adds `aria-busy="true"` and a spin animation on the refresh
  icon while it's truthy.
