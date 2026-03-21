import { describe, it, expect } from 'vitest';
import { resolveTokens } from '../tokens/resolver';
import { ThemePreset, StyleSystem } from '../core/enums';

const mockConfig = {
  theme: ThemePreset.Minimal,
  styleSystem: StyleSystem.CSS,
  tokens: {
    color: { primary: '#6C63FF', textMuted: '#6B6B8A' },
    radius: { sm: '4px', md: '8px' },
    spacing: { unit: '4px' },
    typography: { fontFamily: 'system-ui', scaleBase: '16px' },
  },
} as any;

describe('resolveTokens', () => {
  it('loads minimal preset colors by default', () => {
    const { cssVars } = resolveTokens({ ...mockConfig, tokens: undefined });
    expect(cssVars['--color-primary']).toBe('#6C63FF');
  });

  it('user color overrides preset', () => {
    const { cssVars } = resolveTokens({
      ...mockConfig,
      tokens: { color: { primary: '#FF0000' } },
    });
    expect(cssVars['--color-primary']).toBe('#FF0000');
  });

  it('kebab-cases camelCase color keys', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--color-text-muted']).toBe('#6B6B8A');
  });

  it('derives dark tokens when darkMode: true', () => {
    const { darkCssVars } = resolveTokens({ ...mockConfig, darkMode: true });
    expect(darkCssVars).not.toBeNull();
    expect(darkCssVars!['--color-text']).toBe('#f1f5f9');
  });

  it('returns null darkCssVars when darkMode: false', () => {
    const { darkCssVars } = resolveTokens({ ...mockConfig, darkMode: false });
    expect(darkCssVars).toBeNull();
  });
});
