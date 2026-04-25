# Call tile picks tel:/clipboard from User-Agent instead of viewport

**Status:** Complete — `onCall` now branches on `BreakpointService.md()` so a viewport `< 768 px` always takes the dialer path.
**Flow:** [29 — Quick Action: Call](../flows/29-quick-action-call/29-quick-action-call.md)
**Traces:** L1-010, L2-038.
**Severity:** Medium — Flow 29 says "Phone present & **viewport is XS/SM** → `tel:`" and "Phone present & **viewport ≥ MD** → clipboard copy". The current code branches on `navigator.userAgent`, so a mobile-sized viewport on a desktop browser (the most common manual-test setup, and the default Playwright project) takes the clipboard branch instead of the dialer branch. Tablet browsers in desktop mode hit the opposite mismatch.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.ts`:

```ts
const phone = c.phones[0];
const isMobile = /Mobi|Android|iPhone|iPad/i.test(navigator.userAgent);
if (isMobile) {
  this.navigateExternal('tel:' + phone);
} else {
  try { await navigator.clipboard.writeText(phone); … }
}
```

There is no viewport-aware service used here, even though `BreakpointService` already exposes `md()` and is consumed in `app.ts` for the same purpose.

## Expected

Flow 29 ties the behaviour to viewport width, not OS. Use `breakpoints.md()` so XS / SM (`< 768 px`) get the dialer and MD+ (`≥ 768 px`) get the clipboard, regardless of the browser User-Agent string.

## Fix sketch

```ts
const phone = c.phones[0];
if (!this.breakpoints.md()) {
  this.navigateExternal('tel:' + phone);
} else {
  …clipboard branch…
}
```

`BreakpointService` is already injected wherever the shell needs it; inject it into `ContactDetailPage` next to the existing services.
