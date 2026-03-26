import { describe, test, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';
import { Framework, ThemePreset, StyleSystem, ComponentName } from '../../core/enums';

const THEMES = [ThemePreset.Minimal, ThemePreset.Soft] as const;
const STYLE_SYSTEMS = [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS] as const;
const COMPONENTS = [
  ComponentName.Button,
  ComponentName.Input,
  ComponentName.Card,
  ComponentName.Dialog,
  ComponentName.Select,
];

describe('Theme Permutation Snapshots', () => {
  describe.each(THEMES)('Theme: %s', (theme) => {
    describe.each(STYLE_SYSTEMS)('StyleSystem: %s', (styleSystem) => {
      describe.each(COMPONENTS)('Component: %s', (component) => {
        test('renders correctly', async () => {
          const config = {
            framework: Framework.React,
            theme,
            styleSystem,
            tokens: {
              color: { primary: '#000', surface: '#fff' },
              radius: { md: '4px' },
              spacing: { unit: '4px' },
              typography: { scaleBase: '16px' },
            },
            features: { hover: true, focusRing: true, motionSafe: true },
            a11y: {
              focusRingColor: 'var(--color-primary)',
              focusRingWidth: '2px',
              focusRingOffset: '3px',
              reduceMotion: true,
            },
          } as any;

          const tokens = resolveTokens(config);
          const model = buildComponentModel(component, tokens, config, false);
          const output = await renderComponent(model);

          expect(output).toMatchSnapshot();
        });
      });
    });
  });
});
