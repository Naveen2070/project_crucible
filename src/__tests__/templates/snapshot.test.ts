import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';
import { Framework, ThemePreset, StyleSystem, ComponentName } from '../../core/enums';

const mockConfig = {
  framework: Framework.React,
  theme: ThemePreset.Minimal,
  styleSystem: StyleSystem.CSS,
  tokens: {
    color: {
      primary: '#6C63FF',
      secondary: '#F3F2FF',
      surface: '#FFFFFF',
      background: '#F8F9FA',
      border: '#E2E1F0',
      text: '#1A1A2E',
      textMuted: '#6B6B8A',
      destructive: '#E24B4A',
      success: '#1D9E75',
    },
    radius: { sm: '4px', md: '8px', lg: '12px' },
    spacing: { unit: '4px' },
    typography: { fontFamily: 'system-ui, sans-serif', scaleBase: '16px' },
  },
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
  darkMode: true,
} as any;

describe('6. Template and Snapshot Tests', () => {
  describe('6.3: Dark mode snapshot', () => {
    it('generates dark mode CSS variables', async () => {
      const tokens = resolveTokens(mockConfig);
      expect(tokens.darkCssVars).not.toBeNull();
      expect(tokens.darkCssVars!['--color-text']).toBeDefined();
    });

    it('includes dark mode styles in component output', async () => {
      const tokens = resolveTokens(mockConfig);
      const model = buildComponentModel(ComponentName.Button, tokens, mockConfig, true);
      const files = await renderComponent(model);

      expect(files['Button.module.css']).toMatchSnapshot();
    });
  });

  describe('6.4: Story files in snapshots', () => {
    it('generates story file when stories enabled', async () => {
      const config = { ...mockConfig };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Button, tokens, config, true);
      const files = await renderComponent(model);

      expect(files['Button.stories.tsx']).toBeDefined();
    });

    it('skips story file when stories disabled', async () => {
      const config = { ...mockConfig };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Button, tokens, config, false);
      const files = await renderComponent(model);

      expect(files['Button.stories.tsx']).toBeUndefined();
    });
  });

  describe('6.6: Tailwind arbitrary syntax', () => {
    it('preserves arbitrary CSS variable syntax', async () => {
      const config = {
        ...mockConfig,
        styleSystem: StyleSystem.Tailwind,
        tokens: {
          ...mockConfig.tokens,
          color: { primary: '#6C63FF' },
        },
      };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Button, tokens, config, false);
      const files = await renderComponent(model);

      expect(files['Button.tsx']).toContain('[var(--color-primary)]');
    });
  });

  describe('6.7: SCSS nested BEM', () => {
    it('generates nested BEM output in SCSS', async () => {
      const config = {
        ...mockConfig,
        styleSystem: StyleSystem.SCSS,
      };
      const tokens = resolveTokens(config);
      const model = buildComponentModel(ComponentName.Button, tokens, config, false);
      const files = await renderComponent(model);

      expect(files['Button.module.scss']).toMatchSnapshot();
    });
  });
});
