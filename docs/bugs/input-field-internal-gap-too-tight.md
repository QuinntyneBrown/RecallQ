# Input field label sits 8px above its input, not 16px

**Status:** Open
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md), [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The shared `app-input-field` packs each label tight against its input, but the design uses a uniform 16px gap throughout the form (label → input → next label → next input → submit).

In `docs/ui-design.pen` the register form `RmbOJ` lays its five children — `emailLabel`, `emailInput`, `pwdLabel`, `pwdInput`, `submit` — with `gap: 16`:

```json
{ "id": "RmbOJ", "name": "form", "layout": "vertical", "gap": 16 }
```

There is no nested grouping of label + input — every pair sits at the same 16px rhythm as every other field-to-field gap. Implementation wraps the label + input in `<app-input-field>` whose own column uses `gap: 8`. So the form's outer `gap: 16` only governs gap between fields, not between label and input.

Result:
- design label → input = 16
- impl label → input = 8

The form itself remains correct (16 between fields), so this fix is purely the inner gap on the shared component.

## Observed

`frontend/src/app/ui/input-field/input-field.component.css`:

```css
.field {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
}
```

## Expected

```css
.field {
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
}
```

## Fix sketch

One-token swap. Affects every form using `app-input-field` so they all come into spec at once.
