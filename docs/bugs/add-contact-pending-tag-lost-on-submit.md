# Add contact loses pending tag input when the form is submitted

**Flow:** [05 — Create Contact](../flows/05-create-contact/05-create-contact.md)
**Traces:** L1-002, L2-005.
**Severity:** Medium — Tags only join `tags()` after the visitor explicitly presses Enter inside the tag input. If they type a tag but tap Save without pressing Enter, the in-progress text in `tagInput()` is silently dropped from the payload — the new contact saves without that tag.

## Observed

`frontend/src/app/pages/add-contact/add-contact.page.ts`:

```ts
async onSubmit(ev: Event) {
  ev.preventDefault();
  ...
  const payload = {
    ...
    tags: this.tags(),
    ...
  };
  const result = await this.contacts.create(payload);
  ...
}
```

`tagInput` is never commited at submission time, only inside `commitTag` (which fires on Enter) and `removeTag`.

## Expected

On Save, any non-empty trimmed `tagInput` should be appended to `tags` (deduped) before the payload goes out. Visitors don't have to learn the "press Enter to commit" subtlety to keep the tag they typed.

## Fix sketch

Inline the commit at the top of `onSubmit`:

```ts
const pending = this.tagInput().trim();
if (pending && !this.tags().includes(pending)) {
  this.tags.set([...this.tags(), pending]);
  this.tagInput.set('');
}
```
