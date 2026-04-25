# Delete interaction has no UI affordance

**Status:** Complete — `TimelineItemComponent` now renders a `Delete interaction` icon button and emits its id; `ContactDetailPage.onDeleteInteraction` confirms, calls `interactions.delete`, and refetches the contact.
**Flow:** [14 — Delete Interaction](../flows/14-delete-interaction/14-delete-interaction.md)
**Traces:** L1-003, L2-013, L2-033.
**Severity:** Medium-High — `InteractionsService.delete(id)` and the route `DELETE /api/interactions/{id}` exist, but nothing in the SPA calls them. There is no swipe action, no more-menu, and no delete button on `<app-timeline-item>` — the entire Flow 14 trigger ("User confirms deletion on a timeline row") is unreachable.

## Observed

`grep` of `frontend/src/app/**` for `interactions.delete`, `removeInteraction`, or any "Delete" copy on a timeline item returns no matches. The `TimelineItemComponent` is purely presentational:

```html
<span class="pill" …><i class="ph" […]></i></span>
<span class="body"><span class="title">{{ titleText() }}</span></span>
<span class="time">{{ timeLabel() }}</span>
```

## Expected

Per Flow 14 step 1 the SPA must `DELETE /api/interactions/:id` after the user confirms. At minimum the timeline row needs a delete button with a confirmation gate; on success the row vanishes from the list (Flow 14 step 7).

## Fix sketch

1. Add `@Output() delete = new EventEmitter<string>()` to `TimelineItemComponent` and render an icon button (`aria-label="Delete interaction"`) that emits the interaction id on click.
2. In `ContactDetailPage`, handle `(delete)="onDeleteInteraction($event)"`. The handler `window.confirm`s, calls `interactions.delete(id)`, then re-fetches the contact (which drops the row and updates `interactionTotal`).
3. Use a generic `'Could not delete interaction'` toast on a thrown error.
