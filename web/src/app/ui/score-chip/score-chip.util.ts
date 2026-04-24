export type ScoreTier = 'high' | 'mid' | 'low';

export function computeTier(value: number): ScoreTier {
  if (value >= 0.90) return 'high';
  if (value >= 0.70) return 'mid';
  return 'low';
}
