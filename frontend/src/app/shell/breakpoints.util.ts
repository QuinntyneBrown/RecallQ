// Pure helper that mirrors the breakpoint thresholds in tokens.css.
// Mobile-first: a breakpoint is "active" when viewport width >= its min.
export const BREAKPOINT_MINS = {
  xs: 0,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1280,
} as const;

export type BreakpointFlags = {
  xs: boolean;
  sm: boolean;
  md: boolean;
  lg: boolean;
  xl: boolean;
};

export function breakpointFromWidth(width: number): BreakpointFlags {
  return {
    xs: width >= BREAKPOINT_MINS.xs,
    sm: width >= BREAKPOINT_MINS.sm,
    md: width >= BREAKPOINT_MINS.md,
    lg: width >= BREAKPOINT_MINS.lg,
    xl: width >= BREAKPOINT_MINS.xl,
  };
}
