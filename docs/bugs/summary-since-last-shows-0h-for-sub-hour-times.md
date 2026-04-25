# Relationship summary "Since last" stat shows "0h" for any interaction in the last hour

**Flow:** 26 — View Relationship Summary
**Severity:** Medium-High (every user who logs an interaction sees an awkward, misleading "0h" stat for the next hour)
**Status:** Open

## Symptom

`frontend/src/app/ui/relationship-summary-card/relationship-summary-card.component.ts`:

```typescript
sinceLast(): string {
  const iso = this.summary.lastInteractionAt;
  if (!iso) return '—';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  if (diffMs < 60_000) return 'just now';
  const h = Math.floor(diffMs / 3_600_000);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}
```

The branches are:

| diffMs range            | Output    |
|-------------------------|-----------|
| `< 60_000` (under 1 min)| `just now`|
| `60_000 ≤ x < 3_600_000`| **`0h`**  |
| `< 86_400_000`          | `${h}h`   |
| `≥ 86_400_000`          | `${d}d`   |

For any interaction between 1 minute and 1 hour ago — the **most common** observation window for an actively-used app — `Math.floor(diffMs / 3_600_000)` rounds down to `0`, and the stat band literally renders `0h`.

This means: a user who calls a contact, immediately logs the interaction, and opens the contact's detail page sees:

```
3            0h            Warm
Interactions Since last    Sentiment
```

The "0h" is uninformative (it's a unit with a zero count, not a real duration) and contradicts the "just now" formatting used a moment earlier when the interaction was less than 60 seconds old. There's a roughly 59-minute dead zone where the UI lies.

## Expected

For interactions less than 1 hour old (and ≥ 1 minute), the stat band should render minutes (e.g., `15m`, `42m`) — matching the pattern of `Nh` for hours and `Nd` for days. Boundary behavior:

- `0 ≤ diffMs < 60_000` → `just now`
- `60_000 ≤ diffMs < 3_600_000` → `${m}m` where `m = Math.floor(diffMs / 60_000)` (range 1–59)
- `3_600_000 ≤ diffMs < 86_400_000` → `${h}h` (range 1–23)
- `≥ 86_400_000` → `${d}d`

## Actual

`0h` is rendered for any interaction logged 1–59 minutes ago.

## Repro

1. Open any contact and log an interaction (`POST /api/interactions`).
2. Wait 90 seconds.
3. Reload the contact detail page.
4. Observe the `Since last` stat: it reads `0h`. Expected: `1m`.

Equivalently, in a unit test:

```typescript
const card = new RelationshipSummaryCardComponent();
card.summary = {
  status: 'ready',
  lastInteractionAt: new Date(Date.now() - 30 * 60_000).toISOString(),
  // ...
};
expect(card.sinceLast()).toBe('30m');  // currently returns '0h'
```

## Notes

Radically simple fix — insert one extra branch for minutes:

```typescript
sinceLast(): string {
  const iso = this.summary.lastInteractionAt;
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  if (diffMs < 60_000) return 'just now';
  const m = Math.floor(diffMs / 60_000);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.floor(h / 24)}d`;
}
```

No template, CSS, or backend changes required. The same fix could be unit-tested directly against the component class without DOM, but a Playwright test asserting the rendered `Since last` text under a known mocked `lastInteractionAt` is also straightforward.
