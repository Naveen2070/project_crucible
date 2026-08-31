import { describe, it, expect } from 'vitest';
import { classifyFile } from '../../migrate/classify';

describe('classifyFile', () => {
  const meta = (base: string) => ({ contentHash: 'x', generatedAt: 'now', baseContent: base });

  it('clean: disk === base, render === base', () => {
    const r = classifyFile(meta('v1'), 'v1', 'v1');
    expect(r.state).toBe('clean');
  });

  it('upstream-updated: disk === base, render changed', () => {
    const r = classifyFile(meta('v1'), 'v2', 'v1');
    expect(r.state).toBe('upstream-updated');
  });

  it('user-edited: disk changed, render === base', () => {
    const r = classifyFile(meta('v1'), 'v1', 'v1-edited');
    expect(r.state).toBe('user-edited');
  });

  it('diverged: both disk and render changed', () => {
    const r = classifyFile(meta('v1'), 'v2', 'v1-edited');
    expect(r.state).toBe('diverged');
  });

  it('legacy (no baseContent): disk === render degrades to clean, one-time-adopts base', () => {
    const r = classifyFile({ contentHash: 'x', generatedAt: 'now' }, 'v1', 'v1');
    expect(r.state).toBe('clean');
    expect(r.base).toBe('v1'); // adopted, so the next write can populate baseContent
  });

  it('legacy (no baseContent): disk !== render degrades to user-edited, never merges', () => {
    const r = classifyFile({ contentHash: 'x', generatedAt: 'now' }, 'v2', 'v1-edited');
    expect(r.state).toBe('user-edited');
    expect(r.base).toBeUndefined();
  });

  // Untracked files (no manifest entry at all) are not this function's job — classifyFile always
  // assumes a manifest entry exists. Callers (audit/diff) handle the "no entry" case themselves,
  // mirroring the existing `new` status in src/cli/commands/diff.ts:66-71.

  it('CRLF-only difference (Windows checkout) does not read as a change', () => {
    // base/theirs/ours differ only in line endings, not content — must not misclassify as
    // diverged/user-edited/upstream-updated from autocrlf noise alone.
    const r = classifyFile(meta('line1\nline2\n'), 'line1\r\nline2\r\n', 'line1\r\nline2\r\n');
    expect(r.state).toBe('clean');
  });

  it('CRLF-only OURS still detects a real render change as upstream-updated', () => {
    const r = classifyFile(meta('line1\nline2\n'), 'line1\nline2\nline3\n', 'line1\r\nline2\r\n');
    expect(r.state).toBe('upstream-updated');
  });
});
