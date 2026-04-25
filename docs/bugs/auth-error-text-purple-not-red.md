# Auth error message paints purple, not the design's red

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md), [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Severity:** Low — visual / brand fidelity. The login and register pages render their inline error message in `--accent-secondary` purple. The design's error language (`#FF6B6B` icon + `#FFB3B3` text + `#FF6B6B14` background) is unmistakably red, the colour every operating system uses for "something went wrong".

In `docs/ui-design.pen` the validation error patterns under the Add Contact frame `e9D7e` (and the rest of the design) consistently treat error states as red:

```json
{ "fill": "#FF6B6B", "iconFontName": "triangle-alert" }
{ "content": "Fix 2 errors before saving.", "fill": "#FFB3B3", "fontFamily": "Inter", "fontSize": 13, "fontWeight": "600" }
```

`#FFB3B3` is the text shade. The implementation uses `var(--accent-secondary)` (`#BF40FF`, the brand magenta) for the same role, which reads as a brand accent rather than an error.

## Observed

`frontend/src/app/pages/login/login.page.css` and `frontend/src/app/pages/register/register.page.css`:

```css
.err {
  color: var(--accent-secondary);
  font-size: 14px;
}
```

## Expected

```css
.err {
  color: #FFB3B3;
  font-size: 14px;
}
```

## Fix sketch

Two-character literal in both pages: swap `var(--accent-secondary)` for `#FFB3B3` so error copy adopts the design language. (A token would be cleaner long-term — e.g. `--error-text` — but a literal hex matches the design's exact value and keeps the radically simple fix one line per page.)
