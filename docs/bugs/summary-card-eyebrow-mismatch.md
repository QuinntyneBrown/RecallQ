# Summary card eyebrow reads "AI SUMMARY" instead of "RELATIONSHIP SUMMARY"

**Status:** Complete — `relationship-summary-card.component.ts` template now renders `RELATIONSHIP SUMMARY` in the eyebrow.
**Flow:** [26 — View Relationship Summary](../flows/26-view-relationship-summary/26-view-relationship-summary.md)
**Traces:** L1-008, L2-031.
**Severity:** Low — Flow 26's first sentence calls this surface "the `RELATIONSHIP SUMMARY` card", but `relationship-summary-card.component.ts` renders the eyebrow as `AI SUMMARY`. The mislabel weakens the link between the spec, design system label, and the running app.

## Observed

`frontend/src/app/ui/relationship-summary-card/relationship-summary-card.component.ts`:

```html
<p class="eyebrow">AI SUMMARY</p>
```

## Expected

The eyebrow on the contact-detail summary card should read `RELATIONSHIP SUMMARY`, matching Flow 26's wording. Other "AI" eyebrows (e.g., the home suggestion card with `AI SUGGESTION`) are unaffected — they live on different surfaces.

## Fix sketch

Change the literal string in the template:

```html
<p class="eyebrow">RELATIONSHIP SUMMARY</p>
```
