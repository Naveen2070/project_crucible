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

describe('Switch snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Switch, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Switch.tsx']).toMatchSnapshot();
    expect(files['Switch.module.css']).toMatchSnapshot();
    expect(files['Switch.stories.tsx']).toMatchSnapshot();

    expect(files['Switch.tsx']).toContain('export const Switch');
    expect(files['Switch.tsx']).toContain('role="switch"');
    expect(files['Switch.tsx']).toContain('aria-checked={checked}');
    expect(files['Switch.tsx']).not.toContain('Object.assign');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Switch, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Switch.module.scss']).toMatchSnapshot();
    expect(files['Switch.tsx']).toContain("import styles from './Switch.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Switch, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Switch.tsx']).toMatchSnapshot();
    expect(files['Switch.module.css']).toBeUndefined();
    expect(files['Switch.tsx']).toContain('role="switch"');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Switch, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Switch.vue']).toMatchSnapshot();
    expect(files['Switch.vue']).toContain('role="switch"');
    expect(files['Switch.vue']).toContain('update:modelValue');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Switch, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['switch.component.ts']).toMatchSnapshot();
    expect(files['switch.component.html']).toMatchSnapshot();
    expect(files['switch.component.ts']).toContain('export class SwitchComponent');
    expect(files['switch.component.html']).toContain('role="switch"');
    expect(files['switch.component.ts']).not.toContain('Object.assign');
  });
});
