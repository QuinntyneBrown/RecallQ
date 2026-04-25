# Activity timeline interactions not displayed on contact detail page

**Status:** Complete
**Test:** activity-timeline.spec.ts:6 - "flow 12: activity timeline shows recent interactions inline"
**Severity:** High (activity timeline is a core feature)

## Symptom

Test creates 3 interactions for a contact via UI and expects them to appear in the timeline, but page.getByText('Activity 1') fails with "element(s) not found". The interactions appear to be created (button clicks succeed) but are not rendered in the page.

Test failures:
- "flow 12: activity timeline shows recent interactions inline" - waitForElement timeout on "Activity 1"

## Expected

After creating interactions:
1. Interactions are persisted to database
2. Contact detail page renders timeline section with interaction cards
3. Each interaction displays with its content text visible
4. Multiple interactions appear in chronological order

## Actual

Interaction creation may be failing silently or interactions exist but timeline section is not rendering them:
- Button to add interaction may not be found (selector "/log|add.*interaction/i")
- API call to create interaction may fail silently
- Timeline component may not be fetching or displaying interactions

## Repro

1. Register and login
2. Create a contact
3. Navigate to contact detail page
4. Click "Log" or "Add interaction" button
5. Fill form with type: "note", content: "Activity 1"
6. Click save/submit
7. Verify "Activity 1" text appears in timeline

## Root cause

Test was using incorrect form selectors:
- Tried to use `selectOption()` for type but form uses radio buttons
- Incorrect label selectors for Subject and Content fields

## Fix applied

Updated test to:
1. Use `getByRole('radio', { name: /note/i })` for type selection
2. Use correct label selectors: `getByLabel('Subject')` and `getByLabel('Content')`
3. Add `waitForURL` to wait for navigation back to contact detail page
4. This allows the test to properly create interactions and verify they display in timeline
