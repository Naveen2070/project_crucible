import { describe, it, expect } from 'vitest';
import { extractVarRefs, detectCircularRefs } from '../cli/commands/doctor';

describe('extractVarRefs', () => {
  it('extracts single var reference', () => {
    const result = extractVarRefs('var(--color-primary)');
    expect(result).toEqual(['color-primary']);
  });

  it('extracts multiple var references', () => {
    const result = extractVarRefs('var(--color-primary) and var(--color-secondary)');
    expect(result).toEqual(['color-primary', 'color-secondary']);
  });

  it('returns empty array for no references', () => {
    const result = extractVarRefs('#FF0000');
    expect(result).toEqual([]);
  });

  it('extracts var references with kebab-case names', () => {
    const result = extractVarRefs('var(--color-text-muted)');
    expect(result).toEqual(['color-text-muted']);
  });

  it('handles duplicate references', () => {
    const result = extractVarRefs('var(--color-a) var(--color-a)');
    expect(result).toEqual(['color-a', 'color-a']);
  });
});

describe('detectCircularRefs', () => {
  it('returns empty array for no circular references', () => {
    const tokens = {
      primary: '#6C63FF',
      secondary: 'var(--color-primary)',
      text: '#000000',
    };
    const result = detectCircularRefs(tokens);
    expect(result).toEqual([]);
  });

  it('detects direct self-reference', () => {
    const tokens = {
      primary: 'var(--color-primary)',
    };
    const result = detectCircularRefs(tokens);
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects two-way circular reference', () => {
    const tokens = {
      primary: 'var(--color-secondary)',
      secondary: 'var(--color-primary)',
    };
    const result = detectCircularRefs(tokens);
    expect(result.length).toBeGreaterThan(0);
  });

  it('detects three-way circular reference', () => {
    const tokens = {
      a: 'var(--color-b)',
      b: 'var(--color-c)',
      c: 'var(--color-a)',
    };
    const result = detectCircularRefs(tokens);
    expect(result.length).toBeGreaterThan(0);
  });

  it('includes path in circular reference result', () => {
    const tokens = {
      primary: 'var(--color-secondary)',
      secondary: 'var(--color-primary)',
    };
    const result = detectCircularRefs(tokens);
    expect(result[0].path).toBeDefined();
    expect(result[0].path.length).toBeGreaterThanOrEqual(2);
  });
});
