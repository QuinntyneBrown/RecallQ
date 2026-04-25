# "Skip to main content" link is missing

**Flow:** [40 — Keyboard Navigation](../flows/40-keyboard-navigation/40-keyboard-navigation.md)
**Traces:** L1-015, L2-064.
**Severity:** Low — Flow 40 alternatives explicitly call for "**Skip link** at the top of the page jumps past chrome to the main content." A keyboard-only visitor on a wide viewport currently has to Tab through the sidebar and any chrome controls before reaching the page content. WCAG 2.1 SC 2.4.1 (Bypass Blocks) flags the absence as an A-level violation.

## Observed

A `grep` over `frontend/src/app/**` for `skip-link`, `Skip to`, etc. returns no matches. The shell template (`frontend/src/app/app.ts`) renders the status bar, sidebar / bottom nav, and main content with no leading anchor.

## Expected

The first focusable element in the document should be a visually-hidden "Skip to main content" link that appears on focus and, when activated, moves focus to the `<main>` content area.

## Fix sketch

1. In `frontend/src/app/app.ts`, prepend `<a class="skip-link" href="#main">Skip to main content</a>` to the template.
2. Add `id="main"` and `tabindex="-1"` to `<main class="content">`.
3. Add a `.skip-link` rule in the component styles that hides the anchor off-screen until it receives focus, at which point it pops in over the chrome.
