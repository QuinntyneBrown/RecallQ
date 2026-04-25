# Star icon disappears when contact is starred (ph-star-fill class is undefined)

**Flow:** 10 — Star / Unstar Contact
**Severity:** High (the most observable behavior of the entire flow is broken — the user cannot see whether their contact is starred)
**Status:** Open

## Symptom

`frontend/src/app/pages/contact-detail/contact-detail.page.html` renders the star button as:

```html
<button type="button" class="icon-btn" [attr.aria-label]="starred() ? 'Unstar contact' : 'Star contact'" (click)="toggleStar()">
  <i class="ph"
     [class.ph-star]="!starred()"
     [class.ph-star-fill]="starred()"
     [style.color]="starred() ? 'var(--star-fill)' : 'var(--foreground-primary)'"></i>
</button>
```

When the contact is starred, the `<i>` element ends up with classes `ph ph-star-fill`. But `@phosphor-icons/web` v2.1.2 — the version pinned in `frontend/package.json` and the only Phosphor stylesheet imported in `frontend/src/styles.css` (`@import "@phosphor-icons/web/regular/style.css";`) — does **not** define a class called `.ph-star-fill`.

Phosphor's v2 fill weight is published as a separate stylesheet (`@phosphor-icons/web/fill/style.css`) that uses a compound selector pattern, e.g.:

```css
.ph-fill.ph-star:before { content: "\e46a"; }
```

The element must have both the `ph-fill` weight class and the `ph-star` icon class. There is no `.ph-star-fill` selector in any Phosphor v2 stylesheet (verified against the published source for v2.1.2).

So at runtime, when the user taps the star button:

1. The optimistic UI flips `starred()` to `true`.
2. Angular sets the element's class list to `ph ph-star-fill` and the inline color to `var(--star-fill)` (#FFB23D).
3. The browser loads the Phosphor regular font via `.ph`, but no `:before { content: ... }` rule matches `ph-star-fill` — so the `<i>` renders **empty**.
4. Result: the star button visibly disappears (only an empty 36×36 px hit-target remains, with an invisible orange glyph).

This is the most visible behavior of the entire star flow. The user cannot tell at a glance whether a contact is starred. Tapping again "restores" the icon (since the unstarred state correctly uses `ph-star`, which **is** in `regular/style.css`), which makes the bug feel even more like a UI glitch.

## Expected

When `starred() === true`:

- The star renders as a filled, gold (`#FFB23D`) glyph.
- When `starred() === false`, the star renders as an outlined glyph in `--foreground-primary`.
- The hit target, aria-label, and click handler are unchanged.

## Actual

When `starred() === true`, the icon disappears (empty `<i>`); the button shows nothing but its orange color applied to no glyph.

When `starred() === false`, the outlined star renders correctly.

## Repro

1. Open any contact's detail page.
2. Confirm the outlined star icon is visible in the top-right of the hero.
3. Tap the star button.
4. Observe: the icon disappears. The hit target remains, but no glyph is drawn.
5. Inspect the element — the class is `ph ph-star-fill`. Search the loaded stylesheets — there is no rule for `.ph-star-fill`.
6. Tap again to unstar; the outlined star reappears (because `ph-star` **is** defined in `regular/style.css`).

## Notes

Radically simple fix:

1. Import the fill weight stylesheet in `frontend/src/styles.css`:

   ```css
   @import "@phosphor-icons/web/regular/style.css";
   @import "@phosphor-icons/web/fill/style.css";
   ```

2. Change the binding in `contact-detail.page.html` to toggle the **weight** class (`ph` vs `ph-fill`) and keep the icon class (`ph-star`) constant:

   ```html
   <i class="ph-star"
      [class.ph]="!starred()"
      [class.ph-fill]="starred()"
      [style.color]="starred() ? 'var(--star-fill)' : 'var(--foreground-primary)'"></i>
   ```

   This matches Phosphor v2's documented compound-selector pattern (`.ph.ph-star` for outlined, `.ph-fill.ph-star` for filled).

3. Backend behavior is unchanged — the `Starred` flag still PATCHes correctly per flow 10; this is purely a frontend rendering bug.
