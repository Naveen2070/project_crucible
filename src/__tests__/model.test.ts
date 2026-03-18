import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../components/model';

const mockTokens = { cssVars: {}, js: {} };
const mockConfig = {
  framework: 'react',
  features:  { hover: true, focusRing: true, motionSafe: true },
  a11y:      {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px', focusRingOffset: '3px',
    reduceMotion: true,
  },
} as any;

describe('buildComponentModel', () => {
  it('sets correct variants for Button', () => {
    const model = buildComponentModel('Button', mockTokens, mockConfig);
    expect(model.variants).toContain('primary');
    expect(model.variants).toContain('danger');
  });

  it('sets focusTrap for Modal only', () => {
    const modal  = buildComponentModel('Modal',  mockTokens, mockConfig);
    const button = buildComponentModel('Button', mockTokens, mockConfig);
    expect(modal.a11y.focusTrap).toBe(true);
    expect(button.a11y.focusTrap).toBeUndefined();
  });

  it('sets keyboardNav for Select only', () => {
    const select = buildComponentModel('Select', mockTokens, mockConfig);
    expect(select.a11y.keyboardNav).toBe(true);
  });

  it('throws for unknown component', () => {
    expect(() => buildComponentModel('Tooltip', mockTokens, mockConfig)).toThrow();
  });
});
