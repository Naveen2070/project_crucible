import { describe, it, expect } from 'vitest';
import { mergeThreeWay } from '../../migrate/merge';

describe('mergeThreeWay', () => {
  it('no-op: base === theirs === ours', () => {
    const r = mergeThreeWay('const x = 1;\n', 'const x = 1;\n', 'const x = 1;\n');
    expect(r).toEqual({ text: 'const x = 1;\n', conflicts: 0, clean: true });
  });

  it('ours-only: user edited, template unchanged', () => {
    const r = mergeThreeWay('const x = 1;\n', 'const x = 1;\n', 'const x = 2;\n');
    expect(r.text).toBe('const x = 2;\n');
    expect(r.clean).toBe(true);
  });

  it('theirs-only: template updated, user untouched', () => {
    const r = mergeThreeWay('const x = 1;\n', 'const x = 3;\n', 'const x = 1;\n');
    expect(r.text).toBe('const x = 3;\n');
    expect(r.clean).toBe(true);
  });

  it('non-overlapping edits on both sides merge cleanly', () => {
    // An unchanged anchor line between the two edits is required: node-diff3 merges by
    // finding regions common to all three texts, not by independent per-line patching. Two
    // edits with zero shared anchor between them collapse into a single conflicting region.
    const base = 'const a = 1;\nunchanged;\nconst b = 1;\n';
    const theirs = 'const a = 2;\nunchanged;\nconst b = 1;\n';
    const ours = 'const a = 1;\nunchanged;\nconst b = 3;\n';
    const r = mergeThreeWay(base, theirs, ours);
    expect(r.text).toBe('const a = 2;\nunchanged;\nconst b = 3;\n');
    expect(r.clean).toBe(true);
  });

  it('overlapping edits produce conflict markers', () => {
    const base = 'const a = 1;\n';
    const theirs = 'const a = 2;\n';
    const ours = 'const a = 3;\n';
    const r = mergeThreeWay(base, theirs, ours);
    expect(r.clean).toBe(false);
    expect(r.conflicts).toBe(1);
    expect(r.text).toContain('<<<<<<<');
    expect(r.text).toContain('|||||||');
    expect(r.text).toContain('=======');
    expect(r.text).toContain('>>>>>>>');
  });

  it('normalizes CRLF input before diffing', () => {
    const base = 'const a = 1;\r\nunchanged;\r\nconst b = 1;\r\n';
    const theirs = 'const a = 2;\r\nunchanged;\r\nconst b = 1;\r\n';
    const ours = 'const a = 1;\r\nunchanged;\r\nconst b = 3;\r\n';
    const r = mergeThreeWay(base, theirs, ours);
    expect(r.clean).toBe(true);
    expect(r.text).not.toContain('\r');
    expect(r.text).toBe('const a = 2;\nunchanged;\nconst b = 3;\n');
  });

  it('prettier reformat noise (only whitespace changed) does not force a conflict', () => {
    const base = 'const a=1;\n';
    const theirs = 'const a = 1;\n'; // reformatted, same value, only side that changed
    const ours = 'const a=1;\n';
    const r = mergeThreeWay(base, theirs, ours);
    expect(r.clean).toBe(true);
    expect(r.text).toBe('const a = 1;\n');
  });

  it('handles unicode content', () => {
    const base = "const label = 'café';\n";
    const theirs = "const label = 'café ☕';\n";
    const ours = "const label = 'café';\n";
    const r = mergeThreeWay(base, theirs, ours);
    expect(r.text).toBe("const label = 'café ☕';\n");
    expect(r.clean).toBe(true);
  });
});
