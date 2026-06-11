import { describe, it, expect } from 'vitest';
import { lineDiff, hasChanges } from '../cli/utils/line-diff';

describe('lineDiff', () => {
  it('reports no changes for identical text', () => {
    const d = lineDiff('a\nb\nc', 'a\nb\nc');
    expect(hasChanges(d)).toBe(false);
    expect(d.every((l) => l.type === ' ')).toBe(true);
  });

  it('detects an added line', () => {
    const d = lineDiff('a\nc', 'a\nb\nc');
    expect(hasChanges(d)).toBe(true);
    expect(d).toContainEqual({ type: '+', text: 'b' });
  });

  it('detects a removed line', () => {
    const d = lineDiff('a\nb\nc', 'a\nc');
    expect(hasChanges(d)).toBe(true);
    expect(d).toContainEqual({ type: '-', text: 'b' });
  });

  it('detects a replaced line as a remove + add', () => {
    const d = lineDiff('hello', 'world');
    expect(d.filter((l) => l.type === '-').map((l) => l.text)).toEqual(['hello']);
    expect(d.filter((l) => l.type === '+').map((l) => l.text)).toEqual(['world']);
  });

  it('preserves common context lines in order', () => {
    const d = lineDiff('x\nold\nz', 'x\nnew\nz');
    const context = d.filter((l) => l.type === ' ').map((l) => l.text);
    expect(context).toEqual(['x', 'z']);
  });
});
