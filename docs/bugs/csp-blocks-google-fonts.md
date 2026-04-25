# CSP blocks Google Fonts the SPA loads

**Flow:** 34 — Hardened Request Pipeline (CSP)
**Severity:** High (typography fix is a no-op under CSP)
**Status:** Complete — `SecurityHeadersMiddleware.CspValue` now appends `https://fonts.googleapis.com` to `style-src` and `https://fonts.gstatic.com` to `font-src`, so the SPA's Google-Fonts stylesheet and binary downloads are no longer blocked. The matching `SecurityHeadersTests` assertion was updated and now also explicitly asserts both Google domains appear in the CSP string.

## Symptom

`frontend/src/index.html` loads Geist / Geist Mono / Inter from
Google Fonts:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist…">
```

The API's `SecurityHeadersMiddleware` ships this CSP on every
response:

```
default-src 'self';
connect-src 'self' https://api.openai.com;
img-src 'self' data:;
style-src 'self' 'unsafe-inline';
font-src 'self';
frame-ancestors 'none'
```

`style-src` does not include `https://fonts.googleapis.com`, so the
Google Fonts stylesheet would be blocked. `font-src` doesn't
include `https://fonts.gstatic.com`, so even if a stylesheet did
load it couldn't fetch the .woff2 binaries. In any deployment that
actually serves the SPA HTML from the API host (or behind a single
proxy that propagates the CSP), the typography fix
(`geist-and-inter-web-fonts-are-not-loaded` from earlier in this
loop) is silently nullified — browsers fall back to the system
font.

## Expected

- `style-src` allows `https://fonts.googleapis.com`.
- `font-src` allows `https://fonts.gstatic.com`.
- All other directives unchanged so `unsafe-eval` and other unsafe
  values are still rejected.

## Actual

CSP only permits `'self'` for both directives, blocking Google
Fonts entirely.

## Repro

1. Serve the SPA behind the API in production mode (or behind a
   proxy that forwards the API's CSP to HTML responses).
2. Open the home page in a browser.
3. DevTools → Console: see CSP violations for both
   `fonts.googleapis.com` and `fonts.gstatic.com`.
4. The page renders with system fonts; Geist / Inter never load.

## Notes

Radically simple fix: extend the CSP string in
`SecurityHeadersMiddleware.CspValue`:

- `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com`
- `font-src 'self' https://fonts.gstatic.com`

Update the matching assertion in `SecurityHeadersTests.Hsts_and_csp_present_on_every_response`
to reflect the new value.
