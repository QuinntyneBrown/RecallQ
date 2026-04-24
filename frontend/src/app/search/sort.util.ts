export type Sort = 'similarity' | 'recent';
export const DEFAULT_SORT: Sort = 'similarity';

export interface Sortable {
  similarity: number;
  occurredAt?: string | null;
}

export function reorder<T extends Sortable>(results: T[], sort: Sort): T[] {
  const copy = results.slice();
  if (sort === 'similarity') {
    copy.sort((a, b) => b.similarity - a.similarity);
    return copy;
  }
  copy.sort((a, b) => {
    const ao = a.occurredAt;
    const bo = b.occurredAt;
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
