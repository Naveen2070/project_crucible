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

describe('Tooltip Component Snapshots', () => {
  test('renders basic Tooltip correctly', async () => {
    const tokens = resolveTokens(config as any);
    const model = buildComponentModel(ComponentName.Tooltip, tokens, config as any, false);
    const output = await renderComponent(model);

    expect(output['Tooltip.tsx']).toContain('export const Tooltip');
    expect(output['Tooltip.tsx']).toContain('export const TooltipRoot');
    expect(output['Tooltip.tsx']).toContain("role: 'tooltip'");
    // Tooltips do not trap focus.
    expect(output['Tooltip.tsx']).not.toContain('FloatingFocusManager');
    expect(output['Tooltip.module.css']).toContain('.content');
    expect(output).toMatchSnapshot();
  });

  test('renders monolithic Tooltip correctly', async () => {
    const monolithicConfig = { ...config, features: { ...config.features, compoundComponents: false } };
    const tokens = resolveTokens(monolithicConfig as any);
    const model = buildComponentModel(ComponentName.Tooltip, tokens, monolithicConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Tooltip.tsx']).not.toContain('export const TooltipRoot');
    expect(output['Tooltip.tsx']).toContain('export const Tooltip');
    expect(output['Tooltip.module.css']).toContain('.content');
    expect(output).toMatchSnapshot();
  });

  test('renders Tailwind Tooltip correctly', async () => {
    const tailwindConfig = { ...config, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(tailwindConfig as any);
    const model = buildComponentModel(ComponentName.Tooltip, tokens, tailwindConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Tooltip.tsx']).toContain('data-[state=open]:animate-in');
    expect(output['Tooltip.tsx']).toContain('bg-[var(--tooltip-background');
    expect(output['Tooltip.module.css']).toBeUndefined();
    expect(output).toMatchSnapshot();
  });

  test('renders SCSS Tooltip correctly', async () => {
    const scssConfig = { ...config, styleSystem: StyleSystem.SCSS };
    const tokens = resolveTokens(scssConfig as any);
    const model = buildComponentModel(ComponentName.Tooltip, tokens, scssConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Tooltip.tsx']).toContain('export const Tooltip');
    expect(output['Tooltip.module.scss']).toContain('.content');
    expect(output).toMatchSnapshot();
  });

  test('renders Vue Tooltip correctly', async () => {
    const vueConfig = { ...config, framework: Framework.Vue };
    const tokens = resolveTokens(vueConfig as any);
    const model = buildComponentModel(ComponentName.Tooltip, tokens, vueConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Tooltip.vue']).toContain('role="tooltip"');
    expect(output['Tooltip.vue']).toContain('tooltip-content');
    expect(output['Tooltip.vue']).toContain("trigger: 'hover'");
    expect(output).toMatchSnapshot();
  });

  test('renders Angular Tooltip correctly (monolithic)', async () => {
    const ngConfig = { ...config, framework: Framework.Angular };
    const tokens = resolveTokens(ngConfig as any);
    const model = buildComponentModel(ComponentName.Tooltip, tokens, ngConfig as any, false);
    const output = await renderComponent(model);

    expect(output['tooltip.component.ts']).toContain('export class TooltipComponent');
    expect(output['tooltip.component.ts']).toContain("selector: 'app-tooltip'");
    expect(output['tooltip.component.html']).toContain('role="tooltip"');
    // Angular forces monolithic: compound ng-content selects must be absent.
    expect(output['tooltip.component.html']).not.toContain('[tooltip-content]');
    expect(output).toMatchSnapshot();
  });
});
