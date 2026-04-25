# Add contact tag chip remove buttons share an ambiguous aria-label

**Flow:** [05 — Create Contact](../flows/05-create-contact/05-create-contact.md)
**Traces:** L1-002, L1-015.
**Severity:** Low — Each tag chip on the add-contact form renders an `x` close button with `aria-label="Remove tag"`. When the form has multiple tags every button announces the same "Remove tag" text, leaving screen-reader users no way to tell the chips apart and confirm which one will disappear before activating it.

## Observed

`frontend/src/app/pages/add-contact/add-contact.page.html`:

```html
@for (t of tags(); track t) {
  <span class="chip">{{ t }}<button type="button" (click)="removeTag(t)" aria-label="Remove tag">x</button></span>
}
```

## Expected

The aria-label should incorporate the tag value, e.g. `aria-label="Remove tag investor"`, so each chip's button has a unique accessible name reflecting its target.

## Fix sketch

Use Angular's attribute binding to interpolate:

```html
<button type="button" (click)="removeTag(t)" [attr.aria-label]="'Remove tag ' + t">x</button>
```
