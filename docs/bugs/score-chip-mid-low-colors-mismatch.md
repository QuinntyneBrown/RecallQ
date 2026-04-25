# Score chip mid + low colors don't match design

**Status:** Open
**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Severity:** Low — visual / brand fidelity. The score-chip on result cards renders three tiers (high / mid / low). The high tier uses `--success` green correctly, but mid maps to `--accent-secondary` magenta and low maps to a gray (`--foreground-muted`/`--foreground-secondary`). The design tier hexes are:

| Tier  | Token / hex          |
|-------|----------------------|
| High  | `#3DFFB3` (`--success`) ✓ |
| Mid   | `#4BE8FF` (`--accent-tertiary`) — design `lzlpQ` |
| Low   | `#BF40FF` (`--accent-secondary`) — design `fiEpD` |

The implementation reverses Mid (uses purple instead of cyan) and Low (uses gray instead of purple).

## Observed

`frontend/src/app/ui/score-chip/score-chip.component.css`:

```css
.chip.mid {
  background: color-mix(in srgb, var(--accent-secondary) 18%, transparent);
  color: var(--accent-secondary);
}
.chip.low {
  background: color-mix(in srgb, var(--foreground-muted) 18%, transparent);
  color: var(--foreground-secondary);
}
```

## Expected

```css
.chip.mid {
  background: color-mix(in srgb, var(--accent-tertiary) 18%, transparent);
  color: var(--accent-tertiary);
}
.chip.low {
  background: color-mix(in srgb, var(--accent-secondary) 18%, transparent);
  color: var(--accent-secondary);
}
```

## Fix sketch

Two-token swap on each tier. The high tier (`--success`) is already correct.
