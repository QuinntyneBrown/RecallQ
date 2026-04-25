# Timeline-item pill aria-label uses opaque "Ix" abbreviation

**Flow:** 11 — Log Interaction (and timeline rendering generally)
**Severity:** Low-Medium (a11y clarity)
**Status:** Complete — `TimelineItemComponent` now exposes a `typeLabel()` helper that returns the type with a capitalised initial; the pill binds `[attr.aria-label]="typeLabel()"`, so SR users hear plain `Email` / `Call` / `Meeting` / `Note` instead of the opaque `Ix email` form.

## Symptom

`timeline-item.component.html` labels the type pill as:

```html
<span class="pill" [attr.data-type]="item.type" [attr.aria-label]="'Ix ' + item.type">
  <i class="ph" [class]="iconClass()"></i>
</span>
```

So a screen reader announces "Ix email" / "Ix call" / "Ix meeting"
/ "Ix note" before each timeline row's title. The `Ix` prefix is an
internal design-system shorthand for "interaction" but it isn't a
standard English word — VoiceOver and NVDA pronounce it letter by
letter ("I-X"), and JAWS reads it as "icks". Either way, SR users
hear noise instead of useful context.

The visible icon already carries the type for sighted users, and
the row's title (`titleText()`) usually conveys what happened. The
pill's accessible name should either:

- read the plain capitalised type (`Email`, `Call`, `Meeting`,
  `Note`), or
- be hidden from AT entirely.

## Expected

The pill announces a clear, plain-English type: `Email` / `Call` /
`Meeting` / `Note`. SR users hearing a row hear the type name then
the title, e.g., `"Email — Lunch with Avery"`.

## Actual

`Ix email` etc. — letter-by-letter abbreviation that adds confusion.

## Repro

1. Open any contact with a logged interaction.
2. Inspect the `<span class="pill">` element.
3. `aria-label` is `"Ix email"` (or whatever the type is).

## Notes

Radically simple fix: expose a `typeLabel()` getter on
`TimelineItemComponent` that returns the type with a capitalised
initial (`email` → `Email`), and bind `[attr.aria-label]="typeLabel()"`
on the pill.
