import { describe, test, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';
import { Framework, ThemePreset, StyleSystem } from '../../core/enums';

const STYLE_SYSTEMS = [StyleSystem.NativeWind, StyleSystem.StyleSheet] as const;
const COMPONENTS = ['Button', 'Input', 'Card', 'Badge', 'Alert'];

describe('React Native snapshots', () => {
  describe.each(STYLE_SYSTEMS)('StyleSystem: %s', (styleSystem) => {
    describe.each(COMPONENTS)('Component: %s', (component) => {
      test('renders correctly', async () => {
        const config = {
          framework: Framework.ReactNative,
          theme: ThemePreset.Minimal,
          styleSystem,
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
        } as any;

        const tokens = resolveTokens(config);
        const model = buildComponentModel(component, tokens, config, true);
        // `themeImportPath` normally comes from `generate()`, which knows the real outDir;
        // hardcode the default-layout value here so StyleSheet snapshots render deterministically.
        model.themeImportPath = '../../../theme';
        const output = await renderComponent(model);

        expect(output).toMatchSnapshot();
      });
    });
  });
});
