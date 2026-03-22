import { describe, it, expect } from 'vitest';
import { validateConfig } from '../config/validator';
import { Framework, StyleSystem, ThemePreset } from '../core/enums';

const validConfig = {
  version: '1.0.0',
  framework: Framework.React,
  styleSystem: StyleSystem.CSS,
  theme: ThemePreset.Minimal,
  features: {
    hover: true,
    focusRing: true,
    motionSafe: true,
  },
  a11y: {
    focusRingStyle: 'outline',
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '2px',
    reduceMotion: true,
  },
};

describe('validateConfig', () => {
  it('accepts valid minimal config', () => {
    const result = validateConfig({ version: '1.0.0', framework: Framework.React });
    expect(result.framework).toBe(Framework.React);
  });

  it('accepts valid full config', () => {
    const result = validateConfig(validConfig);
    expect(result.framework).toBe(Framework.React);
    expect(result.styleSystem).toBe(StyleSystem.CSS);
    expect(result.theme).toBe(ThemePreset.Minimal);
  });

  it('accepts all framework values', () => {
    const frameworks = [Framework.React, Framework.Angular, Framework.Vue];
    for (const fw of frameworks) {
      const result = validateConfig({ version: '1.0.0', framework: fw });
      expect(result.framework).toBe(fw);
    }
  });

  it('accepts all styleSystem values', () => {
    const styleSystems = [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS];
    for (const ss of styleSystems) {
      const result = validateConfig({
        version: '1.0.0',
        framework: Framework.React,
        styleSystem: ss,
      });
      expect(result.styleSystem).toBe(ss);
    }
  });

  it('accepts darkMode as boolean', () => {
    const result = validateConfig({ ...validConfig, darkMode: true });
    expect(result.darkMode).toBe(true);
  });

  it('accepts darkMode as object with strategy', () => {
    const result = validateConfig({
      ...validConfig,
      darkMode: { strategy: 'auto' },
    });
    expect((result.darkMode as any).strategy).toBe('auto');
  });

  it('accepts darkMode with custom tokens', () => {
    const result = validateConfig({
      ...validConfig,
      darkMode: { strategy: 'manual', tokens: { '--color-bg': '#000' } },
    });
    expect((result.darkMode as any).tokens['--color-bg']).toBe('#000');
  });

  it('accepts custom tokens', () => {
    const result = validateConfig({
      ...validConfig,
      tokens: {
        color: { primary: '#FF0000' },
        radius: { sm: '2px' },
        spacing: { unit: '8px' },
        typography: { fontFamily: 'Arial', scaleBase: '14px' },
      },
    });
    expect((result.tokens as any).color.primary).toBe('#FF0000');
  });

  it('accepts flags with outputDir and stories', () => {
    const result = validateConfig({
      ...validConfig,
      flags: { outputDir: 'custom/components', stories: true },
    });
    expect(result.flags?.outputDir).toBe('custom/components');
    expect(result.flags?.stories).toBe(true);
  });

  it('accepts features with compoundComponents', () => {
    const result = validateConfig({
      ...validConfig,
      features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
    });
    expect(result.features?.compoundComponents).toBe(true);
  });

  it('rejects missing version', () => {
    expect(() => validateConfig({ framework: Framework.React })).toThrow(/version/);
  });

  it('rejects missing framework', () => {
    expect(() => validateConfig({ version: '1.0.0' })).toThrow(/framework/);
  });

  it('rejects invalid framework', () => {
    expect(() => validateConfig({ version: '1.0.0', framework: 'svelte' })).toThrow();
  });

  it('rejects invalid styleSystem', () => {
    expect(() =>
      validateConfig({ version: '1.0.0', framework: Framework.React, styleSystem: 'less' }),
    ).toThrow();
  });

  it('rejects invalid theme', () => {
    expect(() =>
      validateConfig({ version: '1.0.0', framework: Framework.React, theme: 'corporate' }),
    ).toThrow();
  });

  it('rejects darkMode object without strategy', () => {
    expect(() => validateConfig({ ...validConfig, darkMode: { tokens: {} } })).toThrow();
  });

  it('rejects invalid darkMode strategy', () => {
    expect(() => validateConfig({ ...validConfig, darkMode: { strategy: 'auto2' } })).toThrow();
  });

  it('rejects spacing without unit', () => {
    expect(() =>
      validateConfig({
        ...validConfig,
        tokens: {
          color: {},
          radius: {},
          spacing: {},
          typography: { fontFamily: 'Arial', scaleBase: '14px' },
        },
      }),
    ).toThrow();
  });

  it('rejects typography without fontFamily', () => {
    expect(() =>
      validateConfig({
        ...validConfig,
        tokens: {
          color: {},
          radius: {},
          spacing: { unit: '4px' },
          typography: { scaleBase: '14px' },
        },
      }),
    ).toThrow();
  });
});
