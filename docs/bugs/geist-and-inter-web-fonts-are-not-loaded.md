# Geist and Inter web fonts are not loaded

**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md)
**Traces:** L1-012, L2-048, L2-060.
**Severity:** High — every screen renders with system fallbacks, breaking design fidelity globally.

## Observed

- `frontend/src/index.html` loads no web fonts. No `<link rel="preload">`, no Google Fonts, no self-hosted `@font-face`.
- `frontend/src/styles.css` declares the stack `font-family: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;` on `html, body`, but because the Inter file isn't served, the browser falls through to system UI (Segoe UI on Windows).
- No `Geist` or `Geist Mono` font is referenced anywhere in the frontend.

## Expected

Per `docs/ui-design.pen` and L2-048:

- **Geist** — headings and prominent labels (e.g., the `h1 "Create account"` on register, the `Find anyone.` hero on home).
- **Inter** — body copy (labels, supporting text).
- **Geist Mono** — uppercase mono labels (`YOUR QUERY`, `WHY THIS MATCH`, `FOLLOW-UP`, `AI SUGGESTION`, `RELATIONSHIP SUMMARY`).

All three fonts must be self-hosted (or loaded from a single provider) and preloaded to avoid FOUT on initial render.

## Evidence

- Computed `h1` `font-family` during the Flow 01 walkthrough: `"Inter, -apple-system, … sans-serif"` (Geist not in the stack).
- Computed `input` / `button` `font-family`: `"Arial"` — form controls don't inherit, and the browser picks Arial as the default (covered separately in bug *Form controls fall back to Arial instead of Inter*).
- Screenshot: [`screenshots/01-register-empty.png`](screenshots/01-register-empty.png) — the "Create account" heading is rendered in Segoe UI (Windows sans-serif), not Geist.

## Fix sketch

1. Self-host Geist, Inter, Geist Mono under `frontend/public/fonts/` (or use a single provider such as Fontsource).
2. Add `@font-face` declarations and `font-display: swap` to `styles.css`.
3. Preload the weights actually used:
   ```html
   <link rel="preload" as="font" type="font/woff2" href="/fonts/Geist-SemiBold.woff2" crossorigin>
   <link rel="preload" as="font" type="font/woff2" href="/fonts/Inter-Regular.woff2" crossorigin>
   ```
4. Update the font stacks to put `"Geist"` first for headings and `"Geist Mono"` for uppercase mono labels.
