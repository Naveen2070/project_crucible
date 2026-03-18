import { describe, it, expect } from 'vitest';
import { resolveTokens } from '../tokens/resolver';

const mockConfig = {
  tokens: {
    color:      { primary: '#6C63FF', textMuted: '#6B6B8A' },
    radius:     { sm: '4px', md: '8px' },
    spacing:    { unit: '4px' },
    typography: { fontFamily: 'system-ui', scaleBase: '16px' },
  }
} as any;

describe('resolveTokens', () => {
  it('emits CSS variable for each color token', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--color-primary']).toBe('#6C63FF');
  });

  it('kebab-cases camelCase color keys', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--color-text-muted']).toBe('#6B6B8A');
  });

  it('resolves radius tokens', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--radius-md']).toBe('8px');
  });

  it('emits JS object with camelCase keys', () => {
    const { js } = resolveTokens(mockConfig);
    expect(js.colorPrimary).toBe('#6C63FF');
  });
});
