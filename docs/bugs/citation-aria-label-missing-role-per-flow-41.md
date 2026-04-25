# Citation aria-label drops the role/org per flow 41 spec

**Flow:** 41 — Screen Reader Announcement for Streaming Chat (step 5)
**Severity:** Low (a11y completeness — screen-reader users hear `"Contact: Sarah Mitchell, similarity 0.91"` instead of the spec's `"Contact: Sarah Mitchell, VP Product at Stripe, similarity 0.91"`; the role/org context that makes the citation actionable is missing)
**Status:** Complete — `Citation` record now carries `string? ContactRole, string? ContactOrganization`. `CitationRetriever` SQL projects `c.role` and `c.organization` in both hits-CTE branches; the bias-insert path forwards them too. `AskEndpoints`' `event: citations` payload includes `contactRole` and `contactOrganization` on the wire. `CitationCardComponent.Citation` interface gains the optional fields and `ariaLabel()` composes the full flow-41 sentence ("Contact: {name}, {role} at {org}, similarity {score}"), falling back to the simpler shape when neither role nor org is set. New e2e `bug-citation-aria-label-includes-role.spec.ts` asserts the full sentence; the existing simpler-shape test still passes.

## Symptom

Flow 41 step 5:

> Citation mini-cards have `role="link"` with an accessible name `Contact: {name}, {role}, similarity {score}`. They are announced in order.

`frontend/src/app/ui/citation-card/citation-card.component.ts`:

```typescript
ariaLabel(): string {
  return `Contact: ${this.citation.contactName}, similarity ${this.citation.similarity.toFixed(2)}`;
}
```

The previous bug fix (`citation-card-missing-aria-label.md`) documented an intentional shortcut: *"`Citation` interface exposes `contactName` and `similarity` but no role/org — those fields aren't on the wire."* That landed the simpler shape because plumbing role and org through was left for a follow-up — which is this bug.

`backend/RecallQ.Api/Chat/CitationRetriever.cs` already JOINs the contacts row in its SQL:

```sql
FROM contact_embeddings ce JOIN contacts c ON c.id = ce.contact_id
```

But the projection collapses role and organization into a single `MatchedText` snippet:

```sql
c.display_name || COALESCE(' · ' || c.role, '') || COALESCE(' · ' || c.organization, '') AS "MatchedText"
```

— so the snippet that comes over the wire reads `"Sarah Mitchell · VP Product · Stripe"`, but the `Citation` record only forwards `ContactName`, `Snippet`, `Similarity`, and `Source`. Role and organization aren't structured fields on the response.

## Expected

The on-wire `Citation` carries `contactRole` and `contactOrganization` as separate fields. The frontend's `ariaLabel()` then produces the flow-spec shape:

```typescript
ariaLabel(): string {
  const c = this.citation;
  const middle = [c.contactRole, c.contactOrganization].filter(p => p && p.length > 0).join(' at ');
  return middle.length
    ? `Contact: ${c.contactName}, ${middle}, similarity ${c.similarity.toFixed(2)}`
    : `Contact: ${c.contactName}, similarity ${c.similarity.toFixed(2)}`;
}
```

(Falls back to the simpler shape when the contact has neither role nor org, so the announcement reads cleanly.)

## Actual

`Contact: Sarah Mitchell, similarity 0.91` — no role, no org. SR users hear the name and the score but lose the "VP Product at Stripe" hint that helps them decide whether to follow the link.

## Repro

1. Create a contact with role and organization populated.
2. Log an interaction so the embedding runs.
3. Visit `/ask` and ask a question that surfaces the contact in citations.
4. Inspect the citation card's `aria-label` — observe `Contact: <name>, similarity <score>` without role or organization.

## Notes

Radically simple fix:

- `CitationRetriever.cs`: extend `SearchRow`-style record to include `Role`, `Organization`, and update both `SELECT` lists in the SQL to project `c.role`, `c.organization` alongside the existing fields.
- `Chat.Citation` record: add `string? Role`, `string? Organization`.
- `AskEndpoints.cs`: the `items` projection already spreads citation fields with anonymous types — extend it to include `role = c.Role, organization = c.Organization`.
- `frontend/src/app/ui/citation-card/citation-card.component.ts`: extend `Citation` interface with `contactRole?: string | null; contactOrganization?: string | null;` and update `ariaLabel()` to compose the flow-spec sentence.
- Existing `bug-citation-aria-label.spec.ts` asserts the simpler shape; update it to assert the role-bearing shape, or add a second case that seeds a contact with role/org and asserts the full sentence.
