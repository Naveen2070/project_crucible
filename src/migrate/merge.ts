import { mergeDiff3 } from 'node-diff3';

export interface MergeResult {
  text: string;
  conflicts: number;
  clean: boolean;
}

function toLF(s: string): string {
  return s.replace(/\r\n/g, '\n');
}

/**
 * 3-way merge of a generated file: BASE (pristine at last generation), THEIRS (current template
 * render), OURS (on disk). Wraps node-diff3's `mergeDiff3`, which defaults to splitting strings on
 * `/\s+/` (word-level) — overridden to `\n` here since these are source files, not prose.
 */
export function mergeThreeWay(base: string, theirs: string, ours: string): MergeResult {
  const baseLF = toLF(base);
  const theirsLF = toLF(theirs);
  const oursLF = toLF(ours);

  const { conflict, result } = mergeDiff3(oursLF, baseLF, theirsLF, { stringSeparator: '\n' });

  return {
    text: result.join('\n'),
    conflicts: result.filter((line) => line === '<<<<<<<').length,
    clean: !conflict,
  };
}
