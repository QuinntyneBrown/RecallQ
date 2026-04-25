# Import drop-zone does not accept drag-and-drop

**Flow:** 31 — CSV Bulk Import
**Severity:** Medium-High (false UI affordance)
**Status:** Open

## Symptom

The import page advertises a drop-zone:

```html
<label for="csv-file" class="drop-zone" data-testid="drop-zone">
  <input … hidden>
  …
  <span>Drag CSV or click to choose</span>
</label>
```

It is styled with a dashed border and "drop-zone" class, and the
visible copy explicitly says "Drag CSV or click to choose". Yet there
are no `(dragover)`/`(drop)` handlers wired up. The hidden file input
inside the label does not receive drag events because it is hidden.

So when a user drags a file onto the zone:

- No drop handler fires.
- The browser's default behaviour (navigate to or open the file)
  takes over. On a typical browser, dragging a `.csv` onto the page
  causes a navigation away from `/import`, losing all page state.

## Expected

- Dragging a `.csv` file over the drop-zone shows a "drop here"
  visual (or at least prevents the default).
- Releasing the drag updates the page's `file()` signal exactly like
  picking the file via the click-and-choose dialog, so the filename
  appears in the drop-zone label and the `Upload` button enables.

## Actual

- No drop support. Dragging a CSV onto the zone navigates the
  browser to the file URL and the page state is lost.

## Repro

1. Visit `/import`.
2. Drag a `.csv` file from the OS over the dashed drop-zone.
3. Release. The browser opens the file or shows it inline; the
   import page is gone.

## Notes

Radically simple fix:

- On `ImportPage`, add an `onDragOver(ev)` handler that calls
  `ev.preventDefault()` so the browser allows a drop.
- Add an `onDrop(ev)` handler that calls `ev.preventDefault()`,
  reads `ev.dataTransfer?.files?.[0]`, and routes the result through
  the same code path as `onFileChange` (set the file signal, clear
  any error/result).
- Bind `(dragover)` and `(drop)` on the `<label class="drop-zone">`.
