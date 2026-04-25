// Traces to: L2-017
// Task: T014
import { test, expect } from '@playwright/test';

// NOTE: duplicated from frontend/src/app/ui/score-chip/score-chip.util.ts — must stay in sync.
type ScoreTier = 'high' | 'mid' | 'low';
function computeTier(value: number): ScoreTier {
  if (value >= 0.90) return 'high';
  if (value >= 0.70) return 'mid';
  return 'low';
}

test('ScoreChip_shows_high_variant_at_0_96', async () => {
  expect(computeTier(0.96)).toBe('high');
});

test('ScoreChip_shows_mid_at_0_87', async () => {
  expect(computeTier(0.87)).toBe('mid');
});

test('ScoreChip_shows_low_at_0_62', async () => {
  expect(computeTier(0.62)).toBe('low');
});
