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

describe('Progress snapshots', () => {
  it('react css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Progress, tokens, mockConfig, true);
    const files = await renderComponent(model);

    expect(files['Progress.tsx']).toMatchSnapshot();
    expect(files['Progress.module.css']).toMatchSnapshot();
    expect(files['Progress.stories.tsx']).toMatchSnapshot();

    expect(files['Progress.tsx']).toContain('export const Progress');
    expect(files['Progress.tsx']).toContain("role: 'progressbar'");
    expect(files['Progress.tsx']).toContain('aria-valuenow');
    expect(files['Progress.tsx']).not.toContain('Object.assign');
    // Circular variant: SVG ring with stroke-dash math
    expect(files['Progress.tsx']).toContain("variant === 'circular'");
    expect(files['Progress.tsx']).toContain('CIRCUMFERENCE');
    expect(files['Progress.tsx']).toContain('strokeDashoffset');
    expect(files['Progress.module.css']).toContain('.progress-circular');
    expect(files['Progress.module.css']).toContain('@keyframes progress-spin');
  });

  it('react scss mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Progress, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Progress.module.scss']).toMatchSnapshot();
    expect(files['Progress.tsx']).toContain("import styles from './Progress.module.scss'");
  });

  it('react tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Progress, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Progress.tsx']).toMatchSnapshot();
    expect(files['Progress.module.css']).toBeUndefined();
    expect(files['Progress.tsx']).toContain("role: 'progressbar'");
    expect(files['Progress.tsx']).toContain('animate-spin');
  });

  it('vue css mode snapshot', async () => {
    const config = { ...mockConfig, framework: Framework.Vue };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Progress, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Progress.vue']).toMatchSnapshot();
    expect(files['Progress.vue']).toContain('role="progressbar"');
  });

  it('angular css mode snapshot (monolithic)', async () => {
    const config = { ...mockConfig, framework: Framework.Angular };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Progress, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['progress.component.ts']).toMatchSnapshot();
    expect(files['progress.component.html']).toMatchSnapshot();
    expect(files['progress.component.ts']).toContain('export class ProgressComponent');
    expect(files['progress.component.html']).toContain('role="progressbar"');
    expect(files['progress.component.ts']).not.toContain('Object.assign');
  });
});
