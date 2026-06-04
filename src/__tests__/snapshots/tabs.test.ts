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

describe('Tabs Component Snapshots', () => {
  test('renders compound Tabs correctly', async () => {
    const tokens = resolveTokens(config as any);
    const model = buildComponentModel(ComponentName.Tabs, tokens, config as any, false);
    const output = await renderComponent(model);

    expect(output['Tabs.tsx']).toContain('export const Tabs');
    expect(output['Tabs.tsx']).toContain('export const TabsRoot');
    expect(output['Tabs.tsx']).toContain('export const TabsList');
    expect(output['Tabs.tsx']).toContain('export const TabsTrigger');
    expect(output['Tabs.tsx']).toContain('export const TabsContent');
    expect(output['Tabs.tsx']).toContain('Object.assign(TabsRoot');
    expect(output['Tabs.tsx']).toContain('role="tab"');
    expect(output['Tabs.tsx']).toContain('role="tabpanel"');
    expect(output['Tabs.tsx']).toContain('role="tablist"');
    expect(output['Tabs.module.css']).toContain('.list');
    expect(output['Tabs.module.css']).toContain('.trigger');
    expect(output['Tabs.module.css']).toContain('.content');
    expect(output).toMatchSnapshot();
  });

  test('renders monolithic Tabs correctly', async () => {
    const monolithicConfig = { ...config, features: { ...config.features, compoundComponents: false } };
    const tokens = resolveTokens(monolithicConfig as any);
    const model = buildComponentModel(ComponentName.Tabs, tokens, monolithicConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Tabs.tsx']).not.toContain('export const TabsRoot');
    expect(output['Tabs.tsx']).toContain('export const Tabs');
    expect(output['Tabs.tsx']).toContain('items.map');
    expect(output['Tabs.tsx']).toContain('role="tab"');
    expect(output['Tabs.tsx']).toContain('role="tabpanel"');
    expect(output['Tabs.module.css']).toContain('.list');
    expect(output).toMatchSnapshot();
  });

  test('renders Tailwind Tabs correctly', async () => {
    const tailwindConfig = { ...config, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(tailwindConfig as any);
    const model = buildComponentModel(ComponentName.Tabs, tokens, tailwindConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Tabs.tsx']).toBeDefined();
    expect(output['Tabs.module.css']).toBeUndefined();
    expect(output['Tabs.tsx']).toContain('data-[state=active]');
    expect(output['Tabs.tsx']).toContain('var(--tabs-');
    expect(output).toMatchSnapshot();
  });
});
