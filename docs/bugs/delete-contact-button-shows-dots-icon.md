# Delete contact button shows three-dots "more menu" icon

**Flow:** 09 — Delete Contact (Cascade)
**Severity:** Medium-High (misleading affordance, destructive action)
**Status:** Open

## Symptom

`contact-detail.page.html` topbar:

```html
<button type="button" class="icon-btn" aria-label="Delete contact" (click)="deleteContact()">
  <i class="ph ph-dots-three"></i>
</button>
```

The button's icon is `ph-dots-three` — three vertical dots, the
standard mobile/desktop convention for a "more menu / overflow"
control. Sighted users tapping it expect a dropdown with multiple
options (Edit, Share, Delete, etc.). Instead they immediately get a
destructive `Delete this contact?` confirmation.

The aria-label is correct (`Delete contact`), so SR users get the
right cue, but the visual affordance miscommunicates. With a single
tap surface for a destructive action, the icon should match the
action — a trash glyph (`ph-trash`).

## Expected

- Icon is `ph-trash` (or another unambiguous delete glyph).
- aria-label stays `Delete contact`.
- Click still opens the confirm dialog and deletes on confirm.

## Actual

`ph-dots-three` (more-menu) icon for a one-tap delete action.

## Repro

1. Open any contact's detail page.
2. Inspect the topbar button on the right of the star icon.
3. Visible icon is three vertical dots, but tapping triggers a
   delete confirmation.

## Notes

Radically simple fix: change `<i class="ph ph-dots-three"></i>` to
`<i class="ph ph-trash"></i>`. No JS or accessibility changes
required.
