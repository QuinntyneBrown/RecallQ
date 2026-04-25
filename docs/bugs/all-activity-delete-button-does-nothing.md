# All Activity timeline Delete button does nothing

**Flow:** 14 — Delete Interaction
**Severity:** High (broken UI affordance)
**Status:** Open

## Symptom

`timeline-item.component.html` renders a `Delete interaction` trash
button on every row, and `TimelineItemComponent` exposes the
matching `@Output() delete`:

```ts
@Output() delete = new EventEmitter<string>();
onDelete() { this.delete.emit(this.item.id); }
```

`ContactDetailPage` listens for this and calls
`InteractionsService.delete`, then re-fetches the contact:

```html
<app-timeline-item [item]="item"
  (delete)="onDeleteInteraction($event)"
  (edit)="onEditInteraction($event)"/>
```

But `AllActivityPage` (`/contacts/:id/activity`) only binds `(edit)`:

```html
<app-timeline-item [item]="item" (edit)="onEditInteraction($event)"/>
```

So on the All Activity page the trash button fires `delete` into a
parent that doesn't listen. The click is observable visually
(focus ring), but no confirmation dialog opens, no DELETE request
fires, and the row stays put. The user thinks the click "did
nothing".

## Expected

Trash on the All Activity page behaves the same way it does on the
contact-detail timeline:

1. `window.confirm('Delete this interaction?')`.
2. `DELETE /api/interactions/:id`.
3. On success, the row is removed from the list (or the list is
   re-fetched).

## Actual

The click is silently swallowed by the unbound `(delete)` event.

## Repro

1. Open a contact's `Recent activity` and tap the `See all N` link.
2. On `/contacts/:id/activity`, click the trash icon on any row.
3. Observe: nothing happens.

## Notes

Radically simple fix:

- Add `onDeleteInteraction(interactionId)` to `AllActivityPage` that
  confirms via `window.confirm`, calls
  `this.interactions.delete(interactionId)`, then refetches via
  `this.interactions.list(contactId)` and updates the items signal.
- Bind `(delete)="onDeleteInteraction($event)"` on the
  `<app-timeline-item>` in `all-activity.page.html`.
- On error, surface a toast like the contact-detail handler.
