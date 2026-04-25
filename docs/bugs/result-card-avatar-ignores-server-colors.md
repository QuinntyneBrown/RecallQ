# Search result cards ignore server-assigned avatar colors

**Status:** Complete — `ResultCardContact` now carries optional `avatarColorA/B`; both result-card and featured-result-card bind `[style.background]="avatarBackground()"` (a shared helper) on their avatar; `search.page.hydrateContacts` and `onSelect` pass both fields through.
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Traces:** L1-002, L1-004, L2-005, L2-035.
**Severity:** Low-Medium — Mirror of the recent `contact-detail-avatar-ignores-server-colors` fix. The search result cards (`ResultCardComponent`, `FeaturedResultCardComponent`) render every avatar with the same `linear-gradient(135deg, var(--accent-gradient-start), var(--accent-gradient-mid))`. The contact data carries `avatarColorA` / `avatarColorB`, but the `ResultCardContact` interface drops those fields, so even if the cards wanted to honour them they cannot.

## Observed

`frontend/src/app/ui/result-card/result-card.component.ts`:

```ts
export interface ResultCardContact {
  id: string;
  displayName: string;
  initials: string;
  role: string | null;
  organization: string | null;
  tags?: string[];
}
```

`search.page.ts` `hydrateContacts` builds these objects but never reads `c.avatarColorA` / `c.avatarColorB` from the loaded `ContactDetailDto`. Both card templates render `<span class="avatar">{{ contact.initials }}</span>` with the static rule in CSS.

## Expected

When the contact has both colors set, the avatar background should be `linear-gradient(135deg, <colorA>, <colorB>)`. The fallback static gradient stays for contacts where either is null.

## Fix sketch

1. Add `avatarColorA: string | null` and `avatarColorB: string | null` to `ResultCardContact`.
2. In `search.page.ts`'s `hydrateContacts`, pass both fields through alongside the existing ones (and update `onSelect` similarly).
3. In each card's HTML, bind `[style.background]="contact.avatarColorA && contact.avatarColorB ? 'linear-gradient(135deg, ' + contact.avatarColorA + ', ' + contact.avatarColorB + ')' : null"`.
