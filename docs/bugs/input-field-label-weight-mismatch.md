# Input field labels render at the body default weight, not 500

**Status:** Open
**Flow:** [01 — User Registration](../flows/01-user-registration/01-user-registration.md), [02 — Authentication](../flows/02-authentication/02-authentication.md), and every other form using `app-input-field`.
**Severity:** Low — visual / brand fidelity. The form labels (`Email`, `Password`, etc.) sit at the body's 400 weight but the design specifies 500. The slightly heavier cut is what gives form labels their quiet emphasis above the input pill they describe.

In `docs/ui-design.pen` the register / login form labels (`Uxxkk` "Email", `9WwnQ` "Password") are declared as:

```json
{
  "fontFamily": "Inter",
  "fontSize": 14,
  "fontWeight": "500",
  "fill": "#B8B8D4"
}
```

Font-family, font-size, and color all match the implementation already. Only the weight is off.

## Observed

`frontend/src/app/ui/input-field/input-field.component.css`:

```css
label {
  color: var(--foreground-secondary);
  font-size: 14px;
}
```

No `font-weight`, so the label inherits 400 from the body.

## Expected

```css
label {
  color: var(--foreground-secondary);
  font-size: 14px;
  font-weight: 500;
}
```

## Fix sketch

One-line CSS addition in the shared component. Affects every form that uses `app-input-field` — login, register, forgot-password, edit-interaction, add-interaction, add-contact — bringing them all into spec at once.
