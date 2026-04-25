# Citation card has no `aria-label` for screen readers

**Flow:** [41 — Screen Reader Announcement for Streaming Chat](../flows/41-screen-reader-streaming/41-screen-reader-streaming.md)
**Traces:** L1-015, L2-068.
**Severity:** Low — Flow 41 step 5 says each citation mini-card "exposes `role="link"` and an accessible name like `Contact: Sarah Mitchell, VP Product at Stripe, similarity 0.91`." The implementation provides `role="link"` but no `aria-label`, so screen readers fall back to concatenating the link's visible text — contact name, score-chip number, and the matched snippet — without any "Contact:" framing.

## Observed

`frontend/src/app/ui/citation-card/citation-card.component.html`:

```html
<a class="citation" [class.top]="top" [attr.href]="'/contacts/' + citation.contactId"
   (click)="nav($event)" role="link" data-testid="citation-card">
  <div class="row">
    <strong>{{ citation.contactName }}</strong>
    <app-score-chip [value]="citation.similarity"/>
  </div>
  <p class="snippet">{{ citation.snippet }}</p>
</a>
```

The `Citation` interface exposes `contactName` and `similarity` but no role/org — those fields aren't on the wire. So the SPA can't render the spec's full sentence verbatim, but it can still produce `Contact: <name>, similarity <score>` which is the most actionable subset.

## Expected

Bind an `aria-label` like `Contact: {contactName}, similarity {similarity.toFixed(2)}` on the anchor. Sighted users continue to see the visible row + snippet; SR users get a clean announcement.

## Fix sketch

Add a getter on the component:

```ts
ariaLabel(): string {
  return `Contact: ${this.citation.contactName}, similarity ${this.citation.similarity.toFixed(2)}`;
}
```

…and bind it on the anchor: `[attr.aria-label]="ariaLabel()"`.
