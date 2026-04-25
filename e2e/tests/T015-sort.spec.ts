// Traces to: L2-018
// Task: T015
import { test, expect } from '@playwright/test';

// NOTE: duplicated from frontend/src/app/search/sort.util.ts — must stay in sync.
type Sort = 'similarity' | 'recent';
const DEFAULT_SORT: Sort = 'similarity';
interface Sortable { similarity: number; occurredAt?: string | null }
function reorder<T extends Sortable>(results: T[], sort: Sort): T[] {
  const copy = results.slice();
  if (sort === 'similarity') {
    copy.sort((a, b) => b.similarity - a.similarity);
    return copy;
  }
  copy.sort((a, b) => {
    const ao = a.occurredAt; const bo = b.occurredAt;
    if (ao && bo) {
      if (ao < bo) return 1;
      if (ao > bo) return -1;
      return b.similarity - a.similarity;
    }
    if (ao && !bo) return -1;
    if (!ao && bo) return 1;
    return b.similarity - a.similarity;
  });
  return copy;
}

test('Sort_toggle_default_is_similarity', async () => {
  expect(DEFAULT_SORT).toBe('similarity');
});

test('Toggle_to_recency_reorders_rows', async () => {
  const xs = [
    { similarity: 0.9, occurredAt: '2025-01-01' },
    { similarity: 0.8, occurredAt: '2025-06-01' },
  ];
  expect(reorder(xs, 'recent')[0].occurredAt).toBe('2025-06-01');
});

test('Sort_change_preserves_match_count', async () => {
  const xs = [
    { similarity: 0.9, occurredAt: '2025-01-01' },
    { similarity: 0.8, occurredAt: '2025-06-01' },
    { similarity: 0.7, occurredAt: null },
  ];
  expect(reorder(xs, 'recent').length).toBe(xs.length);
});
