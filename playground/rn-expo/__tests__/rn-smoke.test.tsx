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
  if (name === 'Input' && Comp?.Field) {
    const Field = Comp.Field;
    return (
      <Comp>
        <Field placeholder="Email" />
      </Comp>
    );
  }
  if (name === 'RadioGroup' && Comp?.Item) {
    const Item = Comp.Item;
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
  if (name === 'Accordion' && Comp?.Item) {
    const Item = Comp.Item;
    const Trigger = Comp.Trigger;
    const Content = Comp.Content;
    return (
      <Comp type="single" collapsible defaultValue="a">
        <Item value="a">
          <Trigger>
            <Text>Section one</Text>
          </Trigger>
          <Content>
            <Text>Body one</Text>
          </Content>
        </Item>
        <Item value="b">
          <Trigger>
            <Text>Section two</Text>
          </Trigger>
          <Content>
            <Text>Body two</Text>
          </Content>
        </Item>
      </Comp>
    );
  }
  if (name === 'Accordion') {
    // Flat (non-compound) mode renders from an items array.
    return (
      <Comp
        items={[
          { value: 'a', label: 'Section one', content: 'Body one' },
          { value: 'b', label: 'Section two', content: 'Body two' },
        ]}
      />
    );
  }
  if (name === 'Tabs' && Comp?.List) {
    const List = Comp.List;
    const Trigger = Comp.Trigger;
    const Content = Comp.Content;
    return (
      <Comp defaultValue="one">
        <List>
          <Trigger value="one">
            <Text>One</Text>
          </Trigger>
          <Trigger value="two">
            <Text>Two</Text>
          </Trigger>
        </List>
        <Content value="one">
          <Text>One body</Text>
        </Content>
        <Content value="two">
          <Text>Two body</Text>
        </Content>
      </Comp>
    );
  }
  if (name === 'Tabs') {
    // Flat (non-compound) mode renders from an items array.
    return (
      <Comp
        items={[
          { value: 'one', label: 'One', content: 'One body' },
          { value: 'two', label: 'Two', content: 'Two body' },
        ]}
      />
    );
  }
  if (name === 'Dialog' && Comp?.Content) {
    const Content = Comp.Content;
    const Header = Comp.Header;
    const Title = Comp.Title;
    const Close = Comp.Close;
    const Body = Comp.Body;
    return (
      <Comp isOpen onClose={() => {}}>
        <Content accessibilityLabel="Example dialog">
          <Header>
            <Title>
              <Text>Example dialog</Text>
            </Title>
            <Close />
          </Header>
          <Body>
            <Text>Dialog body content.</Text>
          </Body>
        </Content>
      </Comp>
    );
  }
  if (name === 'Form' && Comp?.Field) {
    const Field = Comp.Field;
    const Label = Comp.Label;
    const Control = Comp.Control;
    const Message = Comp.Message;
    return (
      <Comp onSubmit={() => {}}>
        <Field name="workspace" label="Workspace" required>
          <Label>Workspace</Label>
          <Control>
            <Text>value slot</Text>
          </Control>
          <Message>This field is required.</Message>
        </Field>
      </Comp>
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
  Tabs: 'tab',
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
