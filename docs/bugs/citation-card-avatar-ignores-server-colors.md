# Citation mini-card avatar ignores per-contact colors (uses fallback gradient)

**Flow:** 20 — Ask Citations (Mini-Cards)
**Severity:** Low-Medium (visual inconsistency: every other contact-row treatment in the SPA — search result card, featured result, contact detail hero — uses the contact's `avatarColorA` / `avatarColorB` gradient; citation cards alone fall back to a hardcoded `accent-gradient-start → accent-gradient-end`, so the same person looks different in the citations strip vs. in search results)
**Status:** Complete — `Citation` record now carries `string? AvatarColorA, string? AvatarColorB`. `CitationRetriever`'s SQL projects `c.avatar_color_a` and `c.avatar_color_b` in both `hits` CTE branches, the collapsed CTE, and the outer SELECT. The bias-insert path forwards them too. `AskEndpoints` citations payload includes `avatarColorA` and `avatarColorB` on the wire. `CitationCardComponent.Citation` interface gains the optional fields and a new `avatarBackground()` helper composes the gradient; the template binds `[style.background]` on the avatar span. New e2e `bug-citation-avatar-uses-server-colors.spec.ts` stubs a citation with custom colors and asserts the rendered avatar's inline style includes both stops. All 5 existing citation tests still pass.

## Symptom

`frontend/src/app/ui/citation-card/citation-card.component.css`:

```css
.avatar {
  …
  background: linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-end));
}
```

The CSS hardcodes the avatar gradient. The component HTML doesn't bind the background to the citation's per-contact colors:

```html
<span class="avatar" aria-hidden="true">{{ initials() }}</span>
```

Compare to `result-card.component.html` (and `featured-result-card.component.html`), both of which forward server colors:

```html
<span class="avatar" aria-hidden="true" [style.background]="avatarBackground()">{{ contact.initials }}</span>
```

…where `avatarBackground()` is:

```typescript
return c.avatarColorA && c.avatarColorB
  ? `linear-gradient(135deg, ${c.avatarColorA}, ${c.avatarColorB})`
  : null;
```

The `Citation` record/wire format does not carry `avatarColorA` / `avatarColorB` either:

```csharp
public record Citation(Guid ContactId, string ContactName, string? ContactRole, string? ContactOrganization, string Snippet, double Similarity, string Source);
```

Flow 20 step 2 lists exactly that field on the citation wire:

> 2. The endpoint emits `event: citations\ndata: [{ contactId, name, role, **avatarColors**, similarity }, ...]` (up to 3 entries).

The previous fix (`citation-card-missing-avatar.md`) explicitly deferred this:

> Avatar colors stay on the default gradient until the backend starts emitting `avatarColors` per the flow's wire-format note.

This bug is the deferred follow-up.

## Expected

`Citation` carries `string? AvatarColorA, string? AvatarColorB` from the SQL projection; the SSE payload includes `avatarColorA` / `avatarColorB`; `CitationCardComponent` binds the `[style.background]` from those fields with the same fallback shape as `result-card`. Sighted users see the same person rendered with the same colors across search, intro modal, contact detail, and citations.

## Actual

Every citation avatar uses the same purple-cyan gradient regardless of which contact it represents.

## Repro

1. Create two contacts with distinct `avatarColorA` / `avatarColorB` values.
2. Index interactions so both surface in citations.
3. Visit `/ask`, send a question that retrieves both.
4. Inspect the citation cards — both avatars use the identical fallback gradient. The contact-detail hero for the same two contacts shows the distinct gradients.

## Notes

Same shape as the role/organization fix that just landed:

- `Citation` record gains `string? AvatarColorA, string? AvatarColorB`.
- `CitationRetriever.cs`'s SQL projects `c.avatar_color_a`, `c.avatar_color_b` in both `hits` CTE branches and the `collapsed` / outer `SELECT`. The bias-insert path forwards them too.
- `AskEndpoints.cs` citations payload includes `avatarColorA` / `avatarColorB` on the wire.
- `frontend/src/app/ui/citation-card/citation-card.component.ts`'s `Citation` interface gains the optional fields, and the template binds `[style.background]` via a small helper. The CSS `linear-gradient(...)` becomes the fallback only when the contact has no colors.
- `bug-citation-card-has-avatar.spec.ts` is a candidate for a parallel new spec that asserts a contact with custom colors renders those colors on the citation avatar.
