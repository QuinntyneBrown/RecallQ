# Import page content gap is 16, design says 24

**Status:** Open
**Flow:** [Import CSV](../flows/)
**Severity:** Low — visual / brand fidelity. The import page lays its drop-zone, upload button, error, and result summary at gap 16, but the design's content column packs them at 24 — half a step looser.

In `docs/ui-design.pen` the Import frames (`4Hnlr` Idle, `232sO` Processing) declare their content column (`2Cnyt`, `N6Tso`) with `gap: 24`. The Result frame's content (`FhbjS`) uses `gap: 20`; 24 is the dominant value across the working states.

## Observed

`frontend/src/app/pages/import/import.page.css`:

```css
.page {
  display: flex; flex-direction: column; gap: 16px;
  padding: 24px; max-width: 480px; margin: 0 auto;
  color: var(--foreground-primary);
}
```

## Expected

```css
.page {
  ...
  gap: 24px;
  ...
}
```

## Fix sketch

One-token swap. Brings the import page's section rhythm into the design's intent.
