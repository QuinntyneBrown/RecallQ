# Home search placeholder regression after templateUrl refactor

**Flow:** [15 — Vector Semantic Search](../flows/15-vector-search/15-vector-search.md)
**Traces:** L1-004, L2-014.
**Severity:** Low — the earlier fix in `home-search-placeholder-mismatch.md` set the placeholder to `Search by meaning...` in the inline template inside `home.page.ts`. A subsequent editor pass split that component into `templateUrl: './home.page.html'` + `styleUrl: './home.page.css'`, and the new `.html` file was written from an older snapshot — `placeholder="Search contacts"` reappeared.

## Observed

```html
<!-- frontend/src/app/pages/home/home.page.html line 13 -->
<input id="q" class="search-input" type="search" role="searchbox"
       aria-label="Search contacts"
       placeholder="Search contacts"
       (keyup.enter)="goSearch($event)" />
```

The bug document `docs/bugs/home-search-placeholder-mismatch.md` is still marked Complete because the `.ts` file *did* receive the change — but `.ts` no longer carries the template, so the running app has reverted to the original copy.

## Expected

`placeholder="Search by meaning..."`, matching `docs/ui-design.pen` (Search Bar `lpCnN` → `l9VNc`). The behaviour expected by `bug-home-search-placeholder.spec.ts` should hold.

## Fix sketch

Re-apply the placeholder change to `home.page.html` directly. Audit for any other templates that lost in-flight edits during the refactor.
