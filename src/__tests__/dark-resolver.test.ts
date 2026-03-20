import { describe, it, expect } from 'vitest';
import { deriveDarkTokens, normalizeDarkMode } from '../tokens/dark-resolver';

const lightColors = {
  primary: '#6C63FF',
  secondary: '#F3F2FF',
  surface: '#FFFFFF',
  background: '#F8F9FA',
  border: '#E2E1F0',
  text: '#1A1A2E',
  textMuted: '#6B6B8A',
  danger: '#E24B4A',
  success: '#1D9E75',
};

describe('normalizeDarkMode', () => {
  it('true → auto strategy', () => {
    expect(normalizeDarkMode(true)).toEqual({ strategy: 'auto' });
  });
  it('false → null', () => {
    expect(normalizeDarkMode(false)).toBeNull();
  });
  it('undefined → null', () => {
    expect(normalizeDarkMode(undefined)).toBeNull();
  });
  it('object passes through', () => {
    const config = { strategy: 'manual' as const, tokens: { text: '#fff' } };
    expect(normalizeDarkMode(config)).toEqual(config);
  });
});

describe('deriveDarkTokens', () => {
  it('auto: flips text to light', () => {
    const dark = deriveDarkTokens(lightColors, { strategy: 'auto' }, 'minimal');
    expect(dark.text).toBe('#f1f5f9');
    expect(dark.textMuted).toBe('#94a3b8');
  });

  it('manual: user overrides auto values', () => {
    const dark = deriveDarkTokens(
      lightColors,
      { strategy: 'manual', tokens: { text: '#ffffff' } },
      'minimal',
    );
    expect(dark.text).toBe('#ffffff');
    expect(dark.textMuted).toBe('#94a3b8'); // still auto
  });

  it('shifts primary color', () => {
    const dark = deriveDarkTokens(lightColors, { strategy: 'auto' }, 'minimal');
    expect(dark.primary).not.toBe(lightColors.primary);
    // #6C63FF shifted → usually lighter in dark mode
  });
});
