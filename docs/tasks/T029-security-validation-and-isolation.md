# T029 — Security: Validation, Owner Isolation, Secrets

| | |
|---|---|
| **Slice** | [22 Security hardening](../detailed-designs/22-security-hardening/README.md) |
| **L2 traces** | L2-053, L2-054, L2-056, L2-058 |
| **Prerequisites** | T007, T009 (data entities exist) |
| **Produces UI** | No |

## Objective

Final security pass: global EF Core query filters on every owned entity, body-size caps, fail-fast config validation for required secrets, and a test matrix asserting cross-user isolation.

## Scope

**In:**
- Global `HasQueryFilter` for `Contact`, `Interaction`, `ContactEmbedding`, `InteractionEmbedding`, `RelationshipSummary`, `Stack`, `Suggestion`.
- `Kestrel.MaxRequestBodySize = 10 MB` host-level; per-endpoint smaller caps where applicable.
- `Options.Validate(ValidateOnStart=true)` on `DbOptions`, `LlmOptions`, `AuthOptions`.
- A single `CrossUserIsolationTests` that iterates over every protected endpoint with a user-B cookie and asserts 401/404.

**Out:**
- Per-endpoint per-role authorization (no roles in v1).

## ATDD workflow

1. **Red**:
   - `Cross_user_get_contact_returns_404` (L2-056).
   - `Cross_user_get_interaction_returns_404` (L2-056).
   - `Cross_user_search_only_returns_caller_contacts` (L2-056).
   - `Cross_user_summary_returns_404` (L2-056).
   - `Cross_user_suggestion_dismiss_returns_404` (L2-056).
   - `Bearer_in_query_string_rejected_400` (L2-054).
   - `Missing_LLM_API_KEY_fails_fast_at_startup` (L2-058).
   - `XSS_payload_persisted_raw_rendered_escaped` (L2-053) — via Playwright to verify both persistence and rendering.
2. **Green** — wire global filters + options validation + reject bearer-in-query.

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] There is exactly one place where every owned entity's global filter is registered (a central `ConfigureOwnerScope(modelBuilder, currentUser)` helper).
- [ ] No option class is bound via string key without `.Validate(...)`.

## Screenshot

Not applicable (though the XSS test does a Playwright screenshot of the rendered contact page to verify no `<script>` executes — save as `T029-xss-safe.png`).

## Definition of Done

- [ ] All 8 tests pass.
- [ ] `T029-xss-safe.png` shows the literal string `<script>alert(1)</script>` rendered as text.
- [ ] Three verification passes complete clean.
