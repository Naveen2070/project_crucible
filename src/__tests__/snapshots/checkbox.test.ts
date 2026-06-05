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

describe('Checkbox snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Checkbox, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Checkbox.tsx']).toMatchSnapshot();
    expect(files['Checkbox.module.css']).toMatchSnapshot();
    expect(files['Checkbox.stories.tsx']).toMatchSnapshot();

    expect(files['Checkbox.tsx']).toContain('export const Checkbox');
    expect(files['Checkbox.tsx']).toContain('type="checkbox"');
    // indeterminate set imperatively via ref effect, not a JSX attribute
    expect(files['Checkbox.tsx']).toContain('.indeterminate = indeterminate');
    expect(files['Checkbox.tsx']).not.toContain('Object.assign');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Checkbox, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Checkbox.module.scss']).toMatchSnapshot();
    expect(files['Checkbox.tsx']).toContain("import styles from './Checkbox.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Checkbox, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Checkbox.tsx']).toMatchSnapshot();
    expect(files['Checkbox.module.css']).toBeUndefined();
    expect(files['Checkbox.tsx']).toContain('accent-[var(--color-primary)]');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Checkbox, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Checkbox.vue']).toMatchSnapshot();
    expect(files['Checkbox.vue']).toContain('type="checkbox"');
    expect(files['Checkbox.vue']).toContain('inputRef.value.indeterminate');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Checkbox, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['checkbox.component.ts']).toMatchSnapshot();
    expect(files['checkbox.component.html']).toMatchSnapshot();
    expect(files['checkbox.component.ts']).toContain('export class CheckboxComponent');
    expect(files['checkbox.component.html']).toContain('[indeterminate]="indeterminate"');
    expect(files['checkbox.component.ts']).not.toContain('Object.assign');
  });
});
