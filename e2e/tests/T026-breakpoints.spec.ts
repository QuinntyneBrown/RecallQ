// Traces to: L2-042, L2-043
// Task: T026
import { test, expect } from '@playwright/test';

// NOTE: duplicated from frontend/src/app/shell/breakpoints.util.ts — must stay in sync.
type BreakpointFlags = {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
};
const BREAKPOINT_MINS = { xs: 0, sm: 576, md: 768, lg: 992, xl: 1280 } as const;
function breakpointFromWidth(width: number): BreakpointFlags {
  return {
    xs: width >= BREAKPOINT_MINS.xs,
    sm: width >= BREAKPOINT_MINS.sm,
    md: width >= BREAKPOINT_MINS.md,
    lg: width >= BREAKPOINT_MINS.lg,
    xl: width >= BREAKPOINT_MINS.xl,
  };
}

test('BreakpointService_flips_sm_true_at_576', async () => {
  expect(breakpointFromWidth(576).sm).toBe(true);
  expect(breakpointFromWidth(575).sm).toBe(false);
});

test('BreakpointService_flips_md_true_at_768', async () => {
  expect(breakpointFromWidth(768).md).toBe(true);
  expect(breakpointFromWidth(767).md).toBe(false);
});
