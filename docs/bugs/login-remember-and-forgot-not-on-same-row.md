# Login `Remember me` and `Forgot password?` sit on separate rows, not a single space-between row

**Status:** Open
**Flow:** [02 — Authentication](../flows/02-authentication/02-authentication.md)
**Severity:** Low — visual / brand fidelity. The two affordances live on separate stacked rows, but the design pairs them in one horizontal row with the checkbox on the left and the link on the right.

In `docs/ui-design.pen` the login form holds a `rememberRow` (`mJfJ2`):

```json
{
  "id": "mJfJ2",
  "name": "rememberRow",
  "justifyContent": "space_between",
  "children": [
    { "id": "wse0b", "name": "rememberMe", "children": ["checkbox", "Remember me"] },
    { "id": "KTo4x", "name": "forgot", "content": "Forgot password?" }
  ]
}
```

The implementation breaks the two children into two siblings of the form:

```html
<div class="forgotRow"><a ...>Forgot password?</a></div>
<div class="rememberRow"><app-checkbox label="Remember me" .../></div>
```

with `.forgotRow { justify-content: flex-end; margin-top: -8px }` and `.rememberRow { display: flex; align-items: center }`. So the link is right-aligned on its own row and the checkbox sits on the next row.

## Observed

`frontend/src/app/pages/login/login.page.html` (lines 21–30):

```html
<div class="forgotRow">
  <a routerLink="/forgot-password" [queryParams]="{ email: email() }">Forgot password?</a>
</div>
<div class="rememberRow">
  <app-checkbox label="Remember me" [checked]="rememberMe()" (checkedChange)="rememberMe.set($event)"/>
</div>
```

## Expected

A single row with the checkbox on the left and the link on the right:

```html
<div class="rememberRow">
  <app-checkbox label="Remember me" [checked]="rememberMe()" (checkedChange)="rememberMe.set($event)"/>
  <a routerLink="/forgot-password" [queryParams]="{ email: email() }">Forgot password?</a>
</div>
```

```css
.rememberRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.rememberRow a {
  color: var(--accent-tertiary);
  text-decoration: none;
  font-weight: 600;
  font-size: 14px;
}
```

## Fix sketch

Move the `<a>` into `.rememberRow`, set `justify-content: space-between`, drop the now-empty `.forgotRow` rule. The link styling moves under `.rememberRow a` (or stays under `.forgotRow a` with the new HTML inheriting). Markup loses one wrapper.
