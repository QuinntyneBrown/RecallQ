# T035 — E2E Major Flow: Responsive Sweep

| | |
|---|---|
| **Slice** | Integration of slice 21 across all surfaces |
| **L2 traces** | L2-041, L2-042, L2-043, L2-044, L2-045, L2-046 |
| **Prerequisites** | T026, T027, and at least T014 + T010 (pages to render) |
| **Produces UI** | Yes |

## Objective

Exercise the app at all five viewports and confirm: XS matches mobile design; SM centers content; MD shows sidebar; LG shows two-pane search; XL shows three-pane; state (query, conversation, selection) survives resizes.

## Scope

**In:**
- One spec `tests/T035-responsive.spec.ts` iterating over `VP`.
- Screenshots per viewport for both home and search results pages.

**Out:**
- Tablet-portrait specific tweaks.

## ATDD workflow

1. **Red — e2e**:
   - For each viewport preset in `VP`:
     - Resize page to `{width, height}`.
     - Go to `/home`. Screenshot `T035-home-{key}.png`.
     - Assert landmark visibility:
       - XS/SM: bottom nav visible.
       - MD+: sidebar visible, bottom nav hidden.
       - LG/XL: search results page uses two/three panes when at `/search`.
     - Perform a search for `"investor"`. Screenshot `T035-search-{key}.png`.
     - Click a result. At LG/XL assert right pane updates; at XS–MD assert navigation to `/contacts/:id`.
   - Start at XS, type into search input, resize to LG; assert query preserved.
2. **Green** — assertions pass.

## Playwright POM

Uses existing pages. No additions.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] Touch target check at XS: all interactive elements are ≥ 44×44 CSS pixels (scripted assertion).
- [ ] At MD+, bottom nav is not in the DOM at all (not merely hidden via CSS) — asserts landmark cleanliness.

## Screenshots

10 images — `home` and `search` at each of `xs/sm/md/lg/xl`.

## Definition of Done

- [ ] Spec green consistently.
- [ ] Three verification passes complete clean.
