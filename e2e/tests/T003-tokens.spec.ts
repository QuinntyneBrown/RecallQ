// Traces to: L2-047, L2-049
// Task: T003
import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const REQUIRED_TOKENS = [
  '--surface-primary',
  '--surface-secondary',
  '--surface-elevated',
  '--foreground-primary',
  '--foreground-secondary',
  '--foreground-muted',
  '--border-subtle',
  '--border-strong',
  '--accent-primary',
  '--accent-secondary',
  '--accent-tertiary',
  '--success',
  '--accent-gradient-start',
  '--accent-gradient-mid',
  '--accent-gradient-end',
  '--radius-md',
  '--radius-lg',
  '--radius-full',
];

test('tokens.css declares every required variable', () => {
  const tokensPath = path.resolve(__dirname, '../../web/src/app/tokens.css');
  const css = fs.readFileSync(tokensPath, 'utf8');
  for (const name of REQUIRED_TOKENS) {
    expect(css, `missing ${name}`).toContain(`${name}:`);
  }
});
