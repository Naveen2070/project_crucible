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

describe('Separator snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Separator, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Separator.tsx']).toMatchSnapshot();
    expect(files['Separator.module.css']).toMatchSnapshot();
    expect(files['Separator.stories.tsx']).toMatchSnapshot();

    expect(files['Separator.tsx']).toContain('export const Separator');
    expect(files['Separator.tsx']).toContain("role={decorative ? 'none' : 'separator'}");
    expect(files['Separator.tsx']).not.toContain('Object.assign');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Separator, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Separator.module.scss']).toMatchSnapshot();
    expect(files['Separator.tsx']).toContain("import styles from './Separator.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Separator, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Separator.tsx']).toMatchSnapshot();
    expect(files['Separator.module.css']).toBeUndefined();
    expect(files['Separator.tsx']).not.toContain('Separator.module');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Separator, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Separator.vue']).toMatchSnapshot();
    expect(files['Separator.vue']).toContain('role="separator"');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Separator, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['separator.component.ts']).toMatchSnapshot();
    expect(files['separator.component.html']).toMatchSnapshot();
    expect(files['separator.component.ts']).toContain('export class SeparatorComponent');
    expect(files['separator.component.ts']).not.toContain('Object.assign');
  });
});
