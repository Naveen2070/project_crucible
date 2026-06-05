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

describe('RadioGroup snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.RadioGroup, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['RadioGroup.tsx']).toMatchSnapshot();
    expect(files['RadioGroup.module.css']).toMatchSnapshot();
    expect(files['RadioGroup.stories.tsx']).toMatchSnapshot();

    expect(files['RadioGroup.tsx']).toContain('export const RadioGroup');
    expect(files['RadioGroup.tsx']).toContain('role="radiogroup"');
    expect(files['RadioGroup.tsx']).toContain('role="radio"');
    expect(files['RadioGroup.tsx']).toContain('aria-checked');
    expect(files['RadioGroup.tsx']).toContain('Object.assign');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.RadioGroup, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['RadioGroup.module.scss']).toMatchSnapshot();
    expect(files['RadioGroup.tsx']).toContain("import styles from './RadioGroup.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.RadioGroup, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['RadioGroup.tsx']).toMatchSnapshot();
    expect(files['RadioGroup.module.css']).toBeUndefined();
    expect(files['RadioGroup.tsx']).not.toContain('RadioGroup.module');
    expect(files['RadioGroup.tsx']).toContain('role="radiogroup"');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.RadioGroup, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['RadioGroup.vue']).toMatchSnapshot();
    expect(files['RadioGroup.vue']).toContain('role="radiogroup"');
    expect(files['RadioGroup.vue']).toContain("role: 'radio'");
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.RadioGroup, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['radiogroup.component.ts']).toMatchSnapshot();
    expect(files['radiogroup.component.html']).toMatchSnapshot();
    expect(files['radiogroup.component.ts']).toContain('export class RadioGroupComponent');
    expect(files['radiogroup.component.ts']).not.toContain('Object.assign');
    expect(files['radiogroup.component.html']).toContain('role="radiogroup"');
  });
});
