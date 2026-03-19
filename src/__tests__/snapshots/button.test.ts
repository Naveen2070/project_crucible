import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';

const mockConfig = {
  framework: 'react',
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

describe('Button snapshot', () => {
  it('Button.tsx matches snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model = buildComponentModel('Button', tokens, mockConfig);
    const files = await renderComponent(model);
    expect(files['Button.tsx']).toMatchSnapshot();
    expect(files['Button.module.css']).toMatchSnapshot();
  });
});
