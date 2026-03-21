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
      danger: '#E24B4A',
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

describe('Modal snapshots', () => {
  it('css mode snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel(ComponentName.Modal, tokens, mockConfig, true);
    const files = await renderComponent(model);
    expect(files['Modal.tsx']).toMatchSnapshot();
    expect(files['Modal.module.css']).toMatchSnapshot();
    expect(files['Modal.stories.tsx']).toMatchSnapshot();
  });

  it('tailwind mode snapshot', async () => {
    const config = { ...mockConfig, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(config);
    const model = buildComponentModel(ComponentName.Modal, tokens, config, true);
    const files = await renderComponent(model);
    expect(files['Modal.tsx']).toMatchSnapshot();
    expect(files['Modal.module.css']).toBeUndefined();
    expect(files['Modal.stories.tsx']).toMatchSnapshot();
  });
});
