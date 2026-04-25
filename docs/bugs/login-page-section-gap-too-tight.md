# Login page section gap is 16px instead of 32px

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The login page columns brand, headline, form, and "Don't have an account?" line all 16px apart, but the design's content column packs them at 32 — twice the gap, so the page feels considerably tighter than intended.

In `docs/ui-design.pen` the login frame (`14Keh`) wraps everything in a content column (`J7c8f`):

```json
{ "id": "J7c8f", "name": "content", "layout": "vertical", "gap": 32 }
```

That `gap: 32` separates the four section frames inside it: brand (`8XwK4`), hero (`qoVhd`), form (`57It8`), and aux (`fOfC7`). The form's own internal gap is 16 (which already matches the implementation), so this fix is strictly about the outer column rhythm.

## Observed

`frontend/src/app/pages/login/login.page.css`:

```css
.page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  ...
}
```

## Expected

```css
.page {
  display: flex;
  flex-direction: column;
  gap: 32px;
  ...
}
```

## Fix sketch

One-line CSS change. The `form { gap: 16 }` rule below it stays as-is, so the inputs inside the form keep their tight rhythm; only the gaps between brand, headline, form, and aux open up.
