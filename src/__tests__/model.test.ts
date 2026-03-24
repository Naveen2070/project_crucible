import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../components/model';
import { Framework, ComponentName } from '../core/enums';

const mockTokens = { 
  cssVars: {}, 
  darkCssVars: null, 
  js: {}, 
  componentTokens: {
    button: {},
    card: {},
    input: {},
    modal: {},
    select: {}
  }
} as any;
const mockConfig = {
  framework: Framework.React,
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
} as any;

describe('buildComponentModel', () => {
  it('sets correct variants for Button', () => {
    const model = buildComponentModel(ComponentName.Button, mockTokens, mockConfig, false);
    expect(model.variants).toContain('primary');
    expect(model.variants).toContain('danger');
  });

  it('sets focusTrap for Modal only', () => {
    const modal = buildComponentModel(ComponentName.Modal, mockTokens, mockConfig, false);
    const button = buildComponentModel(ComponentName.Button, mockTokens, mockConfig, false);
    expect(modal.a11y.focusTrap).toBe(true);
    expect(button.a11y.focusTrap).toBeUndefined();
  });

  it('sets keyboardNav for Select only', () => {
    const select = buildComponentModel(ComponentName.Select, mockTokens, mockConfig, false);
    expect(select.a11y.keyboardNav).toBe(true);
  });

  it('sets framework flags correctly', () => {
    const reactModel = buildComponentModel(ComponentName.Button, mockTokens, { ...mockConfig, framework: Framework.React }, false);
    const angularModel = buildComponentModel(ComponentName.Button, mockTokens, { ...mockConfig, framework: Framework.Angular }, false);
    const vueModel = buildComponentModel(ComponentName.Button, mockTokens, { ...mockConfig, framework: Framework.Vue }, false);

    expect(reactModel.isReact).toBe(true);
    expect(angularModel.isAngular).toBe(true);
    expect(vueModel.isVue).toBe(true);
  });

  it('disables compoundComponents for angular regardless of config', () => {
    const model = buildComponentModel(ComponentName.Button, mockTokens, {
      ...mockConfig,
      framework: Framework.Angular,
      features: { ...mockConfig.features, compoundComponents: true }
    }, false);
    expect(model.features.compoundComponents).toBe(false);
  });

  it('throws for unknown component', () => {
    expect(() => buildComponentModel('Tooltip' as any, mockTokens, mockConfig, false)).toThrow();
  });
});
