export type SortDirection = 'asc' | 'desc';

export interface SortResult<T> {
  data: T[];
  direction: SortDirection;
}

export function sort<T extends Record<string, unknown>>(
  data: T[],
  key: string,
  direction: SortDirection,
): T[] {
  if (!key || !direction) return data;

  const sorted = [...data].sort((a, b) => {
    const aValue = a[key];
    const bValue = b[key];

    const aType = detectType(aValue);
    const bType = detectType(bValue);

    if (aType === 'number' && bType === 'number') {
      return direction === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    }

    if (aType === 'date' && bType === 'date') {
      const aDate = new Date(aValue as string | number).getTime();
      const bDate = new Date(bValue as string | number).getTime();
      return direction === 'asc' ? aDate - bDate : bDate - aDate;
    }

    const aStr = String(aValue ?? '').toLowerCase();
    const bStr = String(bValue ?? '').toLowerCase();

    if (direction === 'asc') {
      return aStr.localeCompare(bStr);
    }
    return bStr.localeCompare(aStr);
  });

  return sorted;
}

function detectType(value: unknown): 'string' | 'number' | 'date' | 'unknown' {
  if (typeof value === 'number') return 'number';
  if (typeof value === 'string') {
    if (!isNaN(Date.parse(value)) && value.length > 6) return 'date';
  }
  return 'string';
}

export function cycleSortDirection(current: SortDirection | null): SortDirection {
  if (!current) return 'asc';
  if (current === 'asc') return 'desc';
  return 'asc';
}
