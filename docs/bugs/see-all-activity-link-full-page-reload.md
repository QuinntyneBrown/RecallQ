# "See all N" activity link does a full page reload

**Flow:** [07 — View Contact Detail](../flows/07-view-contact-detail/07-view-contact-detail.md)
**Traces:** L1-009, L2-035.
**Severity:** Medium — clicking the `See all 24` link on a contact's detail page navigates with a plain `<a href>`, so the browser performs a full document reload instead of an Angular Router transition. The visitor loses every in-memory signal (auth, contacts cache, ask conversation, suggestion state) and the load is noticeably slower.

## Observed

`frontend/src/app/pages/contact-detail/contact-detail.page.ts`:

```html
@if (c.interactionTotal > 3) {
  <a [attr.href]="'/contacts/' + c.id + '/activity'" role="link">See all {{ c.interactionTotal }}</a>
}
```

`[attr.href]` produces a real `href` attribute. With no `routerLink` directive on the same anchor, Angular does **not** intercept the click — the browser handles it as a top-level navigation and tears down the SPA.

## Expected

Internal navigations should go through `Router.navigateByUrl` / `routerLink` so the running app state survives. Per Flow 07 alternative on Back navigation: "the SPA restores the source list with query, scroll position, and history intact" — a full reload is the opposite of that contract.

## Fix sketch

Swap the attribute binding for a `routerLink` directive:

```html
<a [routerLink]="['/contacts', c.id, 'activity']" role="link">See all {{ c.interactionTotal }}</a>
```

`RouterLink` is already imported by the contact-detail page (used via the router service); ensure it is in the component's `imports` array.
