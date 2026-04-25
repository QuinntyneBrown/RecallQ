# Import "See N errors" toggle paints purple, project accent is cyan

**Status:** Open
**Flow:** [Import CSV](../flows/)
**Severity:** Low — visual / brand fidelity. The "See N errors" toggle button on the import-result summary tints `--accent-primary` purple. Like every other interactive accent recently swept onto cyan, this should match `--accent-tertiary` for consistency with the project's strategy.

## Observed

`frontend/src/app/pages/import/import.page.css`:

```css
.errors-toggle {
  align-self: flex-start; background: transparent;
  color: var(--accent-primary); border: 0; cursor: pointer;
  font-size: 14px; padding: 4px 0;
}
```

## Expected

```css
.errors-toggle {
  ...
  color: var(--accent-tertiary);
  ...
}
```

## Fix sketch

One-token swap.
