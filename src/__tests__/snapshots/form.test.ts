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

const COMPOUND_EXPORTS = [
  'FormRoot',
  'FormField',
  'FormItem',
  'FormLabel',
  'FormControl',
  'FormDescription',
  'FormMessage',
  'FormSubmit',
];

describe('Form Component Snapshots', () => {
  test('renders compound Form correctly', async () => {
    const tokens = resolveTokens(config as any);
    const model = buildComponentModel(ComponentName.Form, tokens, config as any, false);
    const output = await renderComponent(model);

    for (const name of COMPOUND_EXPORTS) {
      expect(output['Form.tsx']).toContain(`export const ${name}`);
    }
    expect(output['Form.tsx']).toContain('export const Form');
    expect(output['Form.tsx']).toContain('Object.assign(FormRoot');
    expect(output['Form.module.css']).toContain('.field');
    expect(output['Form.module.css']).toContain('.message');
    expect(output).toMatchSnapshot();
  });

  test('renders monolithic (schema-driven) Form correctly', async () => {
    const monolithicConfig = { ...config, features: { ...config.features, compoundComponents: false } };
    const tokens = resolveTokens(monolithicConfig as any);
    const model = buildComponentModel(ComponentName.Form, tokens, monolithicConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Form.tsx']).not.toContain('export const FormField');
    expect(output['Form.tsx']).toContain('export const Form');
    expect(output['Form.tsx']).toContain('fields');
    expect(output['Form.tsx']).toContain('fields.map');
    expect(output['Form.module.css']).toContain('.field');
    expect(output).toMatchSnapshot();
  });

  test('renders Tailwind Form correctly (CSS fallback until Tailwind port lands)', async () => {
    const tailwindConfig = { ...config, styleSystem: StyleSystem.Tailwind };
    const tokens = resolveTokens(tailwindConfig as any);
    const model = buildComponentModel(ComponentName.Form, tokens, tailwindConfig as any, false);
    const output = await renderComponent(model);

    expect(output['Form.tsx']).toBeDefined();
    expect(output['Form.tsx']).toContain('export const Form');
    expect(output['Form.module.css']).toBeUndefined();
    expect(output).toMatchSnapshot();
  });
});
