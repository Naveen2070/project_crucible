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

describe('Label snapshots', () => {
  it('css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Label, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Label.tsx']).toMatchSnapshot();
    expect(files['Label.module.css']).toMatchSnapshot();
    expect(files['Label.stories.tsx']).toMatchSnapshot();

    // Presentational label: forwardRef, required marker, no compound sub-parts
    expect(files['Label.tsx']).toContain('export const Label');
    expect(files['Label.tsx']).toContain('aria-hidden="true"');
    expect(files['Label.tsx']).not.toContain('Object.assign');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Label, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Label.tsx']).toMatchSnapshot();
    expect(files['Label.module.scss']).toMatchSnapshot();
    // .tsx falls back to the CSS template, whose styles-import resolves to .scss
    expect(files['Label.tsx']).toContain("import styles from './Label.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Label, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Label.tsx']).toMatchSnapshot();
    expect(files['Label.module.css']).toBeUndefined();
    // Inline utility classes, no CSS-module import
    expect(files['Label.tsx']).not.toContain('Label.module');
    expect(files['Label.tsx']).toContain('inline-flex items-center');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Label, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Label.vue']).toMatchSnapshot();
    expect(files['Label.vue']).toContain('<label');
    expect(files['Label.vue']).toContain('aria-hidden="true"');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Label, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['label.component.ts']).toMatchSnapshot();
    expect(files['label.component.html']).toMatchSnapshot();
    // Angular is always monolithic — a class component, never compound
    expect(files['label.component.ts']).toContain('export class LabelComponent');
    expect(files['label.component.ts']).not.toContain('Object.assign');
    expect(files['label.component.html']).toContain('<ng-content></ng-content>');
  });
});
