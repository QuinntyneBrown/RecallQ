# Home Smart Stacks render cards with `count = 0`

**Status:** Complete — `StacksService.refresh()` now filters the signal to stacks with `count > 0`.
**Flow:** [24 — Smart Stacks](../flows/24-smart-stacks/24-smart-stacks.md)
**Traces:** L1-006, L2-026.
**Severity:** Medium — empty stack cards clutter the home surface. A fresh visitor (or one whose stack is temporarily empty) sees `0 AI founders` cards that are semantically meaningless; Flow 24 step 5 explicitly calls for those cards to be hidden.

## Observed

`frontend/src/app/stacks/stacks.service.ts` sets the signal with the raw API response:

```ts
const body = (await res.json()) as StackDto[];
this.stacks.set(body);
```

`home.page.ts` then renders every entry, no filter:

```html
@for (s of stacksService.stacks(); track s.id) {
  <app-stack-card [stack]="s"/>
}
```

If the server returns a `count = 0` stack (perfectly legal — counts drift with contact churn, and caches can go stale), the SPA still renders `0 <name>` on home. `StackCardComponent.displayCount()` just prints `'0'`.

## Expected

Per Flow 24 step 5: "Stacks with `count = 0` are hidden by the SPA (never shown as `0 …`)."

## Fix sketch

Filter the response in `StacksService.refresh()` so the signal only ever holds stacks with `count > 0`:

```ts
const body = (await res.json()) as StackDto[];
this.stacks.set(body.filter(s => s.count > 0));
```

Keeps the `/api/stacks` contract honest (server can still return zero-count entries) while the SPA honours the design rule.
