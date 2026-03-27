import { describe, it, expect } from 'vitest';
import { deriveDarkTokens, normalizeDarkMode } from '../tokens/dark-resolver';
import { ThemePreset, DarkModeStrategy } from '../core/enums';

const lightColors = {
  primary: '#6C63FF',
  secondary: '#F3F2FF',
  surface: '#FFFFFF',
  background: '#F8F9FA',
  border: '#E2E1F0',
  text: '#1A1A2E',
  textMuted: '#6B6B8A',
  destructive: '#E24B4A',
  success: '#1D9E75',
};

describe('normalizeDarkMode', () => {
  it('true → auto strategy', () => {
    expect(normalizeDarkMode(true)).toEqual({ strategy: DarkModeStrategy.Auto });
  });
  it('false → null', () => {
    expect(normalizeDarkMode(false)).toBeNull();
  });
  it('undefined → null', () => {
    expect(normalizeDarkMode(undefined)).toBeNull();
  });
  it('object passes through', () => {
    const config = { strategy: DarkModeStrategy.Manual, tokens: { text: '#fff' } };
    expect(normalizeDarkMode(config)).toEqual(config);
  });
});

describe('deriveDarkTokens', () => {
  it('auto: flips text to light', () => {
    const dark = deriveDarkTokens(
      lightColors,
      { strategy: DarkModeStrategy.Auto },
      ThemePreset.Minimal,
    );
    expect(dark.text).toBe('#f1f5f9');
    expect(dark.textMuted).toBe('#94a3b8');
  });

  it('manual: user overrides auto values', () => {
    const dark = deriveDarkTokens(
      lightColors,
      { strategy: DarkModeStrategy.Manual, tokens: { text: '#ffffff' } },
      ThemePreset.Minimal,
    );
    expect(dark.text).toBe('#ffffff');
    expect(dark.textMuted).toBe('#94a3b8'); // still auto
  });

  it('shifts primary color', () => {
    const dark = deriveDarkTokens(
      lightColors,
      { strategy: DarkModeStrategy.Auto },
      ThemePreset.Minimal,
    );
    expect(dark.primary).not.toBe(lightColors.primary);
    // #6C63FF shifted → usually lighter in dark mode
  });
});
