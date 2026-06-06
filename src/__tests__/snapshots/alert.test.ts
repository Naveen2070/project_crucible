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
} as any;

describe('Alert snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Alert, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Alert.tsx']).toMatchSnapshot();
    expect(files['Alert.module.css']).toMatchSnapshot();
    expect(files['Alert.stories.tsx']).toMatchSnapshot();

    expect(files['Alert.tsx']).toContain('export const Alert');
    expect(files['Alert.tsx']).toContain('role="alert"');
    expect(files['Alert.tsx']).not.toContain('Object.assign');
    expect(files['Alert.module.css']).toContain('.alert--destructive');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Alert, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Alert.module.scss']).toMatchSnapshot();
    expect(files['Alert.tsx']).toContain("import styles from './Alert.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Alert, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Alert.tsx']).toMatchSnapshot();
    expect(files['Alert.module.css']).toBeUndefined();
    expect(files['Alert.tsx']).toContain('VARIANT_CLASSES');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Alert, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Alert.vue']).toMatchSnapshot();
    expect(files['Alert.vue']).toContain('role="alert"');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Alert, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['alert.component.ts']).toMatchSnapshot();
    expect(files['alert.component.html']).toMatchSnapshot();
    expect(files['alert.component.ts']).toContain('export class AlertComponent');
    expect(files['alert.component.html']).toContain('role="alert"');
    expect(files['alert.component.ts']).not.toContain('Object.assign');
  });
});
