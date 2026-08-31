import type { FileHashMeta } from '../scaffold/writer';
import { toLF } from './merge';

export type FileState = 'clean' | 'upstream-updated' | 'user-edited' | 'diverged';

export interface FileClassification {
  state: FileState;
  base?: string; // undefined only for legacy (pre-v2) entries
  theirs: string;
  ours: string;
}

/**
 * D2 taxonomy: classifies a tracked file from its manifest entry + a fresh render (theirs) + the
 * on-disk content (ours). Single source of truth shared by `audit`, `diff`, and `upgrade` — callers
 * pass in an already-formatted `theirs`/`ours` (see `formatFile` in `../scaffold/writer`).
 */
export function classifyFile(
  meta: FileHashMeta | undefined,
  theirs: string,
  ours: string,
): FileClassification {
  const base = meta?.baseContent;

  if (base === undefined) {
    // Legacy (pre-v2) entry: no stored BASE, so a real 3-way merge is impossible. Degrade to
    // today's binary semantics instead of guessing — never merge blind.
    if (toLF(ours) === toLF(theirs)) return { state: 'clean', base: ours, theirs, ours }; // one-time adoption
    return { state: 'user-edited', theirs, ours };
  }

  // CRLF-only differences (Windows checkouts) must never read as a real change.
  const diskChanged = toLF(ours) !== toLF(base);
  const renderChanged = toLF(theirs) !== toLF(base);

  if (!diskChanged && !renderChanged) return { state: 'clean', base, theirs, ours };
  if (!diskChanged && renderChanged) return { state: 'upstream-updated', base, theirs, ours };
  if (diskChanged && !renderChanged) return { state: 'user-edited', base, theirs, ours };
  return { state: 'diverged', base, theirs, ours };
}
