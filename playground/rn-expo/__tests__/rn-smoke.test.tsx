import React from 'react';
import fs from 'node:fs';
import path from 'path';
import { render } from '@testing-library/react-native';
import { Text } from 'react-native';

const STYLES = ['nativewind', 'stylesheet'] as const;
const COMPONENTS_DIR = path.join(__dirname, '..', 'components');

/**
 * Props each generated component needs to render standalone.
 * With `compoundComponents` enabled, Button/Card roots expect node children
 * (raw strings must be wrapped in <Text> per RN rules) — Badge/Alert are Text-safe.
 */
const PROPS: Record<string, Record<string, unknown>> = {
  Button: { children: <Text>Press me</Text> },
  Card: { title: 'Title', children: <Text>Body</Text> },
  Badge: { children: 'New' },
  Alert: { title: 'Heads up', children: 'Detail' },
  Label: { children: 'Email', required: true },
  Avatar: { alt: 'Ada Lovelace' },
  Progress: { value: 60 },
  Separator: {},
  Skeleton: { width: 120, height: 16 },
  Switch: { defaultChecked: true },
  Checkbox: { label: 'Accept terms' },
  Textarea: { placeholder: 'Notes' },
};

/** Compound components take no render props on their root — compose through their parts. */
function elementFor(name: string, Comp: any) {
  if (name === 'Input' && typeof Comp === 'object' && Comp !== null && 'Field' in Comp) {
    const Field = (Comp as any).Field;
    return (
      <Comp>
        <Field placeholder="Email" />
      </Comp>
    );
  }
  if (name === 'RadioGroup' && typeof Comp === 'object' && Comp !== null && 'Item' in Comp) {
    const Item = (Comp as any).Item;
    return (
      <Comp defaultValue="a">
        <Item value="a" label="One" />
        <Item value="b" label="Two" />
      </Comp>
    );
  }
  if (name === 'RadioGroup') {
    // Flat (non-compound) mode renders from an items array.
    return (
      <Comp
        items={[
          { value: 'a', label: 'One' },
          { value: 'b', label: 'Two' },
        ]}
      />
    );
  }
  return <Comp {...(PROPS[name] ?? {})} />;
}

/** a11y contract: components that must expose an accessibilityRole. */
const EXPECTED_ROLES: Record<string, string | undefined> = {
  Button: 'button',
  Alert: 'alert',
  Progress: 'progressbar',
  Switch: 'switch',
  Checkbox: 'checkbox',
};

function discover(): string[] {
  const files: string[] = [];
  for (const style of STYLES) {
    const dir = path.join(COMPONENTS_DIR, String(style));
    if (!fs.existsSync(dir)) continue;
    for (const comp of fs.readdirSync(dir)) {
      const main = path.join(dir, comp, `${comp}.tsx`);
      if (fs.existsSync(main)) files.push(main);
    }
  }
  return files;
}

/** Recursively find an accessibilityRole in the rendered RN tree (version-agnostic). */
function hasRole(node: any, role: string): boolean {
  if (!node || typeof node !== 'object') return false;
  if (node.props?.accessibilityRole === role) return true;
  return (node.children ?? []).some((child: any) => hasRole(child, role));
}

describe('RN generated components (Expo playground)', () => {
  const files = discover();

  beforeAll(() => {
    if (files.length === 0) {
      throw new Error(
        'No generated components found. Run `npm run pg:rn` at the repo root first.',
      );
    }
  });

  it.each(files)(`renders %s`, async (file) => {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require(file);
    const name = path.basename(path.dirname(file));
    const Comp = mod.default ?? mod[name];
    expect(Comp).toBeDefined();

    const utils = await render(elementFor(name, Comp));
    expect(utils.toJSON()).not.toBeNull();
  });

  it.each(files.filter((f) => EXPECTED_ROLES[path.basename(path.dirname(f))] !== undefined))(
    `exposes a11y role for %s`,
    async (file) => {
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      const mod = require(file);
      const name = path.basename(path.dirname(file));
      const Comp = mod.default ?? mod[name];
      const role = EXPECTED_ROLES[name] as string;

      const utils = await render(elementFor(name, Comp));
      expect(hasRole(utils.toJSON(), role)).toBe(true);
    },
  );

  it('covers both style systems for every discovered component', () => {
    const byStyle: Record<string, Set<string>> = { nativewind: new Set(), stylesheet: new Set() };
    for (const file of files) {
      const rel = path.relative(COMPONENTS_DIR, file);
      const [style, comp] = rel.split(path.sep);
      byStyle[style].add(comp);
    }
    expect(byStyle.nativewind.size).toBeGreaterThan(0);
    expect(byStyle.nativewind).toEqual(byStyle.stylesheet);
  });
});
