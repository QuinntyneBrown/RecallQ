# Status bar clock is hardcoded to 9:41

**Status:** Complete — `StatusBarComponent` now renders the app start time formatted for Eastern time.
**Flow:** Mobile shell chrome.
**Traces:** L2-047, L2-048.
**Severity:** Low — visible chrome shows a design-fixture value instead of the actual app start time.

## Observed

`frontend/src/app/ui/status-bar/status-bar.component.html` renders:

```html
<span class="clock">9:41</span>
```

Every user sees `9:41`, regardless of the actual time.

## Expected

The status bar clock should be dynamic and show the app start time in Eastern time (`America/New_York`) using the same compact visual format as the design fixture.

## Fix sketch

Compute the display string once when `StatusBarComponent` is created, format it with `Intl.DateTimeFormat` and `timeZone: 'America/New_York'`, then bind the template to that value.
