export const VIEWPORTS = {
  xs: { width: 375, height: 667 },
  sm: { width: 640, height: 900 },
  md: { width: 820, height: 1180 },
  lg: { width: 1200, height: 800 },
  xl: { width: 1440, height: 900 },
} as const;

export type ViewportName = keyof typeof VIEWPORTS;
