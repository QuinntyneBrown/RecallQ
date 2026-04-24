# RecallQ — Behaviour Flows

Each flow describes one distinct system behaviour end-to-end: what triggers it, who participates, what happens step-by-step, and what the alternatives / error paths are. Every flow carries a PlantUML sequence diagram rendered to PNG and referenced inline.

Sources of truth: [`docs/specs/L1.md`](../specs/L1.md), [`docs/specs/L2.md`](../specs/L2.md), [`docs/detailed-designs/`](../detailed-designs/), [`docs/ui-design.pen`](../ui-design.pen).

## Authentication and accounts

| # | Flow | L1 / L2 traces |
|---|---|---|
| 01 | [User registration](01-user-registration/01-user-registration.md) | L1-001, L2-001, L2-052 |
| 02 | [User login](02-user-login/02-user-login.md) | L1-001, L2-002 |
| 03 | [User logout](03-user-logout/03-user-logout.md) | L1-001, L2-004 |
| 04 | [Authenticated request](04-authenticated-request/04-authenticated-request.md) | L1-001, L2-003, L2-056 |

## Contacts

| # | Flow | L1 / L2 traces |
|---|---|---|
| 05 | [Create contact](05-create-contact/05-create-contact.md) | L1-002, L2-005, L2-076 |
| 06 | [List contacts](06-list-contacts/06-list-contacts.md) | L1-002, L2-009 |
| 07 | [View contact detail](07-view-contact-detail/07-view-contact-detail.md) | L1-009, L2-034–L2-036 |
| 08 | [Update contact](08-update-contact/08-update-contact.md) | L1-002, L2-007 |
| 09 | [Delete contact (cascade)](09-delete-contact/09-delete-contact.md) | L1-002, L2-008 |
| 10 | [Star / unstar contact](10-star-contact/10-star-contact.md) | L1-002, L2-083 |

## Interactions

| # | Flow | L1 / L2 traces |
|---|---|---|
| 11 | [Log interaction](11-log-interaction/11-log-interaction.md) | L1-003, L2-010, L2-033 |
| 12 | [View activity timeline](12-view-activity-timeline/12-view-activity-timeline.md) | L1-003, L2-011, L2-035 |
| 13 | [Update interaction](13-update-interaction/13-update-interaction.md) | L1-003, L2-013 |
| 14 | [Delete interaction](14-delete-interaction/14-delete-interaction.md) | L1-003, L2-013 |

## Vector search

| # | Flow | L1 / L2 traces |
|---|---|---|
| 15 | [Vector semantic search](15-vector-search/15-vector-search.md) | L1-004, L2-014–L2-017, L2-059 |
| 16 | [Search sort (similarity ↔ recency)](16-search-sort/16-search-sort.md) | L1-004, L2-018 |
| 17 | [Search pagination (infinite scroll)](17-search-pagination/17-search-pagination.md) | L1-004, L2-019, L2-062 |
| 18 | [Search zero-result state](18-search-zero-state/18-search-zero-state.md) | L1-004, L2-020 |

## Ask mode (conversational AI)

| # | Flow | L1 / L2 traces |
|---|---|---|
| 19 | [Ask streaming answer](19-ask-streaming/19-ask-streaming.md) | L1-005, L2-021, L2-022, L2-061 |
| 20 | [Ask citations (mini-cards)](20-ask-citations/20-ask-citations.md) | L1-005, L2-023 |
| 21 | [Ask follow-up chips](21-ask-followups/21-ask-followups.md) | L1-005, L2-024 |
| 22 | [Ask new session](22-ask-new-session/22-ask-new-session.md) | L1-005, L2-025 |
| 23 | [Ask AI from contact detail](23-ask-from-contact/23-ask-from-contact.md) | L1-010, L2-040 |

## Smart stacks and proactive suggestions

| # | Flow | L1 / L2 traces |
|---|---|---|
| 24 | [Smart stacks (view and open)](24-smart-stacks/24-smart-stacks.md) | L1-006, L2-026–L2-028 |
| 25 | [Proactive AI suggestion (render + dismiss)](25-proactive-suggestion/25-proactive-suggestion.md) | L1-007, L2-029, L2-030 |

## Relationship summary

| # | Flow | L1 / L2 traces |
|---|---|---|
| 26 | [View relationship summary](26-view-relationship-summary/26-view-relationship-summary.md) | L1-008, L2-031, L2-033 |
| 27 | [Refresh relationship summary (manual)](27-refresh-relationship-summary/27-refresh-relationship-summary.md) | L1-008, L2-032 |

## Quick actions

| # | Flow | L1 / L2 traces |
|---|---|---|
| 28 | [Quick action: Message](28-quick-action-message/28-quick-action-message.md) | L1-010, L2-037 |
| 29 | [Quick action: Call](29-quick-action-call/29-quick-action-call.md) | L1-010, L2-038 |
| 30 | [Quick action: Intro draft](30-quick-action-intro/30-quick-action-intro.md) | L1-010, L2-039 |

## Data import and embedding pipeline

| # | Flow | L1 / L2 traces |
|---|---|---|
| 31 | [CSV bulk import](31-csv-bulk-import/31-csv-bulk-import.md) | L1-018, L2-077 |
| 32 | [Embedding pipeline (async)](32-embedding-pipeline/32-embedding-pipeline.md) | L1-018, L2-078, L2-080 |
| 33 | [Embedding backfill / regeneration](33-embedding-backfill/33-embedding-backfill.md) | L1-018, L2-079 |

## Cross-cutting: security, observability, responsiveness

| # | Flow | L1 / L2 traces |
|---|---|---|
| 34 | [Hardened request pipeline](34-hardened-request-pipeline/34-hardened-request-pipeline.md) | L1-013, L2-052–L2-057 |
| 35 | [Rate limiting (429)](35-rate-limit/35-rate-limit.md) | L1-013, L2-055 |
| 36 | [Owner-scope data isolation](36-owner-scope-isolation/36-owner-scope-isolation.md) | L1-013, L2-056 |
| 37 | [Observability: correlation + logging](37-observability-correlation/37-observability-correlation.md) | L1-016, L2-069, L2-071 |
| 38 | [Metrics scrape (/metrics)](38-metrics-scrape/38-metrics-scrape.md) | L1-016, L2-070 |
| 39 | [Responsive breakpoint resize](39-responsive-breakpoint-resize/39-responsive-breakpoint-resize.md) | L1-011, L2-041–L2-046 |

## Accessibility

| # | Flow | L1 / L2 traces |
|---|---|---|
| 40 | [Keyboard navigation](40-keyboard-navigation/40-keyboard-navigation.md) | L1-015, L2-064–L2-066 |
| 41 | [Screen reader streaming announcement](41-screen-reader-streaming/41-screen-reader-streaming.md) | L1-015, L2-068 |

## Rendering the diagrams

Each flow folder contains an `.md` description, a `.puml` source, and the rendered `.png`. To re-render all diagrams after edits:

```bash
java -jar <path-to-plantuml.jar> -tpng -nometadata -r "C:\projects\RecallQ\docs\flows\**\*.puml"
```

Or from `docs/flows` directly:

```bash
cd docs/flows
java -jar <path-to-plantuml.jar> -tpng -nometadata -r "**/*.puml"
```
