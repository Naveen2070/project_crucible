import { describe, test, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';
import { Framework, ThemePreset, StyleSystem, ComponentName } from '../../core/enums';

const config = {
  framework: Framework.React,
  theme: ThemePreset.Minimal,
  styleSystem: StyleSystem.CSS,
  tokens: {
    color: { primary: '#000', surface: '#fff' },
    radius: { md: '4px' },
    spacing: { unit: '4px' },
    typography: { scaleBase: '16px' },
  },
  features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
  a11y: {
    focusRingColor: 'var(--color-primary)',
    focusRingWidth: '2px',
    focusRingOffset: '3px',
    reduceMotion: true,
  },
};

describe('Popover Component Snapshots', () => {
  test('renders basic Popover correctly', async () => {
    const tokens = resolveTokens(config as any);
    const model = buildComponentModel(ComponentName.Popover, tokens, config as any, false);
    const output = await renderComponent(model);

    expect(output['Popover.tsx']).toContain('export const Popover');
    expect(output['Popover.tsx']).toContain('export const PopoverRoot');
    expect(output['Popover.module.css']).toContain('.popover');
    expect(output).toMatchSnapshot();
  });

  test('renders monolithic Popover correctly', async () => {
    const monolithicConfig = { ...config, features: { ...config.features, compoundComponents: false } };
    const tokens = resolveTokens(monolithicConfig as any);
    const model = buildComponentModel(ComponentName.Popover, tokens, monolithicConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Popover.tsx']).not.toContain('export const PopoverRoot');
    expect(output['Popover.tsx']).toContain('export const Popover');
    expect(output).toMatchSnapshot();
  });

  test('renders Tailwind Popover correctly', async () => {
    const tailwindConfig = { ...config, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(tailwindConfig as any);
    const model = buildComponentModel(ComponentName.Popover, tokens, tailwindConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Popover.tsx']).toContain('bg-[var(--color-surface)]');
    expect(output['Popover.tsx']).toContain('shadow-lg');
    expect(output['Popover.module.css']).toBeUndefined();
    expect(output).toMatchSnapshot();
  });
});
