# PD001 — Reset Password page + Forgot Password success state

| | |
|---|---|
| **Type** | Pencil design |
| **File** | `docs/ui-design.pen` |
| **L2 traces** | L2-087, L2-088, L2-089 |
| **Prerequisites** | `7. Forgot Password` frame exists |

## Objective

Design two screens that complete the password-recovery flow: (1) the success/"check your inbox" state shown after submitting the Forgot Password form, and (2) the Reset Password page reached via the email link.

## Scope

**In:**
- Frame `8. Forgot Password — Sent` (390×844): same chrome and ambient glows as `7. Forgot Password`, status bar, back chevron, brand, success illustration or large `mail-check` lucide icon, heading `Check your inbox`, body explaining a link was sent (use a generic placeholder email like `you@example.com`), `Resend email` ghost button, `Back to sign in` link, home indicator.
- Frame `9. Reset Password` (390×844): status bar, back chevron, brand, heading `Set a new password`, helper line, two password inputs (`New password`, `Confirm password`) styled identically to `6. Login` password input with a show/hide eye icon on the right, password-strength hint line, primary `Update password` button (`Button Primary` instance, `fill_container`), secondary `Cancel` ghost link, home indicator.
- Frame `10. Reset Password — Invalid Link` (390×844): same chrome, alert/triangle icon, heading `This link is no longer valid`, body, primary `Request a new link` button routing back to `7. Forgot Password`.

**Out:**
- SM/MD/LG/XL variants (covered by PD008–PD010).
- Live email rendering / actual email-template design.

## Design notes

- Reuse existing tokens: `$surface-primary`, `$surface-elevated`, `$foreground-primary/secondary/muted`, `$border-subtle`, `$accent-tertiary` (links), `$accent-gradient-*` (brand dot, primary button).
- Reuse the two ambient radial glows (`#7C3AFF66 → #BF40FF33 → transparent` and `#4BE8FF40 → transparent`) at the same coordinates as `7. Forgot Password`.
- Password input row mirrors `6. Login` `Cyzba`: 48px height, `$radius-md`, `$surface-elevated`, `$border-subtle` 1px stroke, 16px horizontal padding.
- The eye/show-hide icon uses lucide `eye` / `eye-off`, 18×18, `$foreground-muted`.
- The invalid-link alert uses lucide `triangle-alert`, 32×32, `$warning`.
- Place new frames to the right of `7. Forgot Password` (`kIobx`) using `find_empty_space_on_canvas`, padding 100, direction `right`.

## Verification

- [ ] `snapshot_layout({ problemsOnly: true })` returns no overlaps.
- [ ] `get_screenshot` for each new frame confirms hierarchy, contrast, and no clipping.
- [ ] All three frames export cleanly to `docs/designs/exports/`.
- [ ] Tokens are referenced as `$…` variables — no hard-coded hex except already-shared gradient stops.

## Definition of Done

- [ ] Three frames added to `ui-design.pen` with `placeholder: false`.
- [ ] PNG exports under `docs/designs/exports/`.
- [ ] Visual review against `7. Forgot Password` confirms identical chrome/ambient/typographic style.
