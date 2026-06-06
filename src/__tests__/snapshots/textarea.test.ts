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

describe('Textarea snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Textarea, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Textarea.tsx']).toMatchSnapshot();
    expect(files['Textarea.module.css']).toMatchSnapshot();
    expect(files['Textarea.stories.tsx']).toMatchSnapshot();

    // Monolithic field with label/hint/error wiring, no compound sub-parts
    expect(files['Textarea.tsx']).toContain('export const Textarea');
    expect(files['Textarea.tsx']).toContain('<textarea');
    expect(files['Textarea.tsx']).toContain('aria-invalid');
    expect(files['Textarea.tsx']).not.toContain('Object.assign');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Textarea, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Textarea.module.scss']).toMatchSnapshot();
    expect(files['Textarea.tsx']).toContain("import styles from './Textarea.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Textarea, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Textarea.tsx']).toMatchSnapshot();
    expect(files['Textarea.module.css']).toBeUndefined();
    expect(files['Textarea.tsx']).not.toContain('Textarea.module');
    expect(files['Textarea.tsx']).toContain('resize-y');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Textarea, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['Textarea.vue']).toMatchSnapshot();
    expect(files['Textarea.vue']).toContain('<textarea');
    expect(files['Textarea.vue']).toContain('update:modelValue');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Textarea, tokens, config, true);
    const files = await renderComponent(model);

    expect(files['textarea.component.ts']).toMatchSnapshot();
    expect(files['textarea.component.html']).toMatchSnapshot();
    expect(files['textarea.component.ts']).toContain('export class TextareaComponent');
    expect(files['textarea.component.ts']).not.toContain('Object.assign');
    expect(files['textarea.component.html']).toContain('<textarea');
  });
});
