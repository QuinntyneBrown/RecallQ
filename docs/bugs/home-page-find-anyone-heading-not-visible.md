# Home page "Find anyone." heading not visible after registration

**Status:** Incomplete
**Test:** responsive-breakpoint-resize.spec.ts:147 - "flow 39: list contacts works across viewport sizes"
**Severity:** Critical (home page not rendering heading, user navigation broken)

## Symptom

After user registration and navigation to /home, the page loads but the heading "Find anyone." is not visible. Test timeout waiting for heading with text "Find anyone." with 20 second timeout.

Test failure:
- "flow 39: list contacts works across viewport sizes" - element not found: heading "Find anyone."

## Expected

After successful registration:
1. User is redirected to /home
2. Home page renders with heading "Find anyone."
3. Contact list is displayed
4. User can interact with the page

## Actual

After registration, navigation to /home occurs but heading is missing:
- Home component might be loading but not rendering
- Heading might be hidden or using different text
- Page might be showing error state
- Layout might be broken at certain breakpoints

## Repro

1. Register a new user (with unique email)
2. After registration, page should show /home
3. Look for heading with text "Find anyone."
4. Heading is not visible or missing

## Root cause investigation needed

- Check if home page component is rendering heading element
- Check if heading text matches test expectation
- Check if heading is conditionally hidden
- Check if CSS or styling hides the heading
- Verify home page renders on mobile XS breakpoint (test uses viewport resizing)

## Related

This could be related to responsive layout changes - test is specifically testing across different viewport sizes (XS, SM, MD, LG, XL).
