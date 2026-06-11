export interface DiffLine {
  type: ' ' | '-' | '+';
  text: string;
}

/**
 * Minimal LCS-based line diff. Returns the merged sequence of context (' '), removed ('-'),
 * and added ('+') lines. Adequate for component-sized files; not optimized for huge inputs.
 */
export function lineDiff(aText: string, bText: string): DiffLine[] {
  const a = aText.split('\n');
  const b = bText.split('\n');
  const n = a.length;
  const m = b.length;

  // dp[i][j] = LCS length of a[i:] and b[j:]
  const dp: number[][] = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const out: DiffLine[] = [];
  let i = 0;
  let j = 0;
  while (i < n && j < m) {
    if (a[i] === b[j]) {
      out.push({ type: ' ', text: a[i] });
      i++;
      j++;
    } else if (dp[i + 1][j] >= dp[i][j + 1]) {
      out.push({ type: '-', text: a[i] });
      i++;
    } else {
      out.push({ type: '+', text: b[j] });
      j++;
    }
  }
  while (i < n) out.push({ type: '-', text: a[i++] });
  while (j < m) out.push({ type: '+', text: b[j++] });
  return out;
}

/** True if the diff contains any added/removed lines. */
export function hasChanges(diff: DiffLine[]): boolean {
  return diff.some((d) => d.type !== ' ');
}
