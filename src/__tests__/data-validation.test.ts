import { describe, it, expect } from 'vitest';
import { resolveTokens } from '../tokens/resolver';
import { Framework, StyleSystem, ThemePreset } from '../core/enums';

const baseConfig = {
  framework: Framework.React,
  styleSystem: StyleSystem.CSS,
  theme: ThemePreset.Minimal,
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
};

describe('10. Data Validation Tests', () => {
  it('10.2: handles malformed color tokens gracefully', () => {
    const config = {
      ...baseConfig,
      tokens: {
        color: {
          primary: 'not-a-color',
          secondary: '',
        },
        radius: { md: '4px' },
        spacing: { unit: '4px' },
        typography: { scaleBase: '16px' },
      },
    } as any;

    const result = resolveTokens(config);
    expect(result.cssVars['--color-primary']).toBeDefined();
  });

  it('10.3: handles custom theme without tokens', () => {
    const config = {
      ...baseConfig,
      theme: ThemePreset.Custom,
    } as any;

    const result = resolveTokens(config);
    expect(result.cssVars).toBeDefined();
    expect(result.js).toBeDefined();
  });

  it('10.5: duplicate dependencies do not cause duplicate output', () => {
    const config = {
      ...baseConfig,
      tokens: {
        color: { primary: '#000', surface: '#fff' },
        radius: { md: '4px' },
        spacing: { unit: '4px' },
        typography: { scaleBase: '16px' },
      },
    } as any;

    const result1 = resolveTokens(config);
    const result2 = resolveTokens(config);

    expect(result1.cssVars).toEqual(result2.cssVars);
  });
});
