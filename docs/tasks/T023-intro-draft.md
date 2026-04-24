# T023 — Quick Action: Intro Draft

| | |
|---|---|
| **Slice** | [18 Intro draft](../detailed-designs/18-quick-action-intro-draft/README.md) |
| **L2 traces** | L2-039, L2-055 |
| **Prerequisites** | T010, T016 (shares `IChatClient`) |
| **Produces UI** | Yes |

## Objective

Ship the Intro tile and modal: pick a second party, LLM-generated draft in a textarea, `Copy` and `Send via email` actions.

## Scope

**In:**
- `POST /api/intro-drafts { contactAId, contactBId }` → `{subject, body}`.
- Rate limit `intro` 20/min/user.
- `IntroModal` component with typeahead picker over user contacts.

**Out:**
- Rich-text editor — plain `<textarea>`.

## ATDD workflow

1. **Red — API**:
   - `Generate_intro_returns_subject_and_body` (L2-039) — `FakeChatClient` returns a deterministic payload.
   - `Invalid_contactB_returns_404` (L2-039).
   - `Intro_rate_limited_at_21_per_minute` (L2-055).
2. **Red — e2e**:
   - `T023-intro.spec.ts` — seed 2 contacts; open A's detail; tap Intro; pick B; Generate; assert body visible; tap Copy; assert clipboard contains body; tap Send; intercept `mailto:a,b?subject=..&body=..`.
3. **Green** — implement endpoint + modal.

## Playwright POM

`pages/modals/intro.modal.ts`:
```ts
export class IntroModal {
  constructor(private page: Page) {}
  async open(fromDetail: ContactDetailPage) { await fromDetail.page.getByRole('button', { name: 'Draft intro' }).click(); }
  async pickOther(name: string) {
    await this.page.getByLabel('Second party').fill(name);
    await this.page.getByRole('option', { name }).click();
  }
  async generate() { await this.page.getByRole('button', { name: 'Generate draft' }).click(); }
  body()  { return this.page.getByRole('textbox', { name: 'Draft body' }); }
  async copy() { await this.page.getByRole('button', { name: 'Copy' }).click(); }
  async sendEmail() { await this.page.getByRole('button', { name: 'Send via email' }).click(); }
}
```

## Verification loop (×3)

Apply the [verification template](README.md#verification-template). Extra checks:
- [ ] `IntroDraftsEndpoints.cs` ≤ 40 lines.
- [ ] Prompt cap: ≤ 400 tokens in, ≤ 200 tokens out.
- [ ] `mailto:` URL is URL-encoded correctly and body truncated at 1500 chars if larger.

## Screenshot

`docs/tasks/screenshots/T023-intro.png` — intro modal at 375×667 with generated draft body visible and Copy/Send buttons.

## Definition of Done

- [x] 3 API tests + 1 e2e pass.
- [x] Three verification passes complete clean.

**Status: Complete**
