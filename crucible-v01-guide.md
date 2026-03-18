# ⚗ Crucible v0.1 — Complete Setup & Work Guide

> 5 Components · Full A11y · React · Token-Driven · 2 Weeks

**Stack:** React + TypeScript · Vitest · Storybook · Chromatic  
**Components:** Button, Input, Card, Modal, Select

---

## Table of Contents

1. [Repo Setup](#1-repo-setup)
2. [Config Schema](#2-cruciblonfigjson--v01-schema)
3. [Engine Source Code](#3-engine-source-code)
4. [Handlebars Templates](#4-handlebars-templates)
5. [Component Accessibility Specs](#5-component-accessibility-specs)
6. [Testing Setup](#6-testing-setup)
7. [Build Order — Week by Week](#7-build-order--week-by-week)
8. [Commands Cheatsheet](#8-commands-cheatsheet)

---

## 1. Repo Setup

### 1.1 Init the monorepo

```bash
mkdir crucible && cd crucible
git init
npm init -y
```

### 1.2 Create the folder structure

```bash
mkdir -p src/{cli,config,tokens,components,templates/{react},scaffold,registry,__tests__/snapshots}
mkdir -p templates/react
mkdir -p playground/react
mkdir -p bin
```

### 1.3 Final folder structure

```
crucible/
  src/
    cli/
      index.ts           ← commander entry point
    config/
      reader.ts          ← loads crucible.config.json
      validator.ts       ← ajv schema validation
    tokens/
      resolver.ts        ← tokens → CSS vars + JS object
    components/
      model.ts           ← builds ComponentModel (IR layer)
    templates/
      engine.ts          ← Handlebars compile + render
    scaffold/
      writer.ts          ← writes files + stores hash
    registry/
      components.ts      ← component → files map
    __tests__/
      resolver.test.ts
      model.test.ts
      snapshots/
        button.test.ts
  templates/
    react/
      Button.tsx.hbs
      Button.module.css.hbs
      Button.stories.tsx.hbs
      Input.tsx.hbs
      Input.module.css.hbs
      Input.stories.tsx.hbs
      Card.tsx.hbs
      Card.module.css.hbs
      Card.stories.tsx.hbs
      Modal.tsx.hbs
      Modal.module.css.hbs
      Modal.stories.tsx.hbs
      Select.tsx.hbs
      Select.module.css.hbs
      Select.stories.tsx.hbs
  playground/
    react/
      package.json
      vite.config.ts
      .storybook/
        main.ts
        preview.ts
      src/
        __generated__/   ← crucible writes here in dev mode
  bin/
    crucible.js          ← npm bin entry
  crucible.config.json
  package.json
  tsconfig.json
  vitest.config.ts
  .crucible-hashes.json  ← auto-generated, do not delete
```

### 1.4 Install engine dependencies

```bash
npm install commander handlebars ajv fs-extra chalk
npm install --save-dev typescript tsx vitest @vitest/coverage-v8
npm install --save-dev @types/node @types/fs-extra
npm install --save-dev prettier eslint concurrently
```

### 1.5 Install playground dependencies

```bash
cd playground/react
npm init -y
npm install react react-dom
npm install --save-dev vite @vitejs/plugin-react typescript
npm install --save-dev @storybook/react-vite @storybook/addon-essentials
npm install --save-dev @storybook/addon-a11y @storybook/addon-interactions
npm install focus-trap-react
cd ../..
```

### 1.6 tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "CommonJS",
    "moduleResolution": "node",
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "resolveJsonModule": true,
    "declaration": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "playground"]
}
```

### 1.7 Root package.json scripts

```json
{
  "scripts": {
    "build":          "tsc",
    "build:watch":    "tsc --watch",
    "dev":            "concurrently \"npm run build:watch\" \"npm run playground\"",
    "playground":     "npm run dev --workspace=playground/react",
    "storybook":      "npm run storybook --workspace=playground/react",
    "generate:dev":   "node dist/cli/index.js add Button --dev",
    "test":           "vitest",
    "test:coverage":  "vitest --coverage",
    "chromatic":      "chromatic --project-token=$CHROMATIC_PROJECT_TOKEN"
  },
  "workspaces": ["playground/react"],
  "bin": {
    "crucible": "./bin/crucible.js"
  }
}
```

### 1.8 bin/crucible.js

```js
#!/usr/bin/env node
require('../dist/cli/index.js');
```

---

## 2. crucible.config.json — v0.1 Schema

Minimal by design. Every key maps to a CSS variable or a feature flag. No behaviours, no effects — that is VOID_PROTOCOL territory for v1+.

```json
{
  "$schema": "./node_modules/crucible/schema.json",
  "version": "1",
  "framework": "react",
  "theme": "minimal",

  "tokens": {
    "color": {
      "primary":    "#6C63FF",
      "secondary":  "#F3F2FF",
      "surface":    "#FFFFFF",
      "background": "#F8F9FA",
      "border":     "#E2E1F0",
      "text":       "#1A1A2E",
      "textMuted":  "#6B6B8A",
      "danger":     "#E24B4A",
      "success":    "#1D9E75"
    },
    "radius": {
      "sm":  "4px",
      "md":  "8px",
      "lg":  "12px"
    },
    "spacing": {
      "unit": "4px"
    },
    "typography": {
      "fontFamily": "system-ui, sans-serif",
      "scaleBase":  "16px"
    }
  },

  "features": {
    "hover":      true,
    "focusRing":  true,
    "motionSafe": true
  },

  "a11y": {
    "focusRingStyle":  "outline",
    "focusRingColor":  "var(--color-primary)",
    "focusRingWidth":  "2px",
    "focusRingOffset": "3px",
    "reduceMotion":    true
  }
}
```

### Token → CSS variable mapping

| Config key | Resolved CSS variable |
|---|---|
| `tokens.color.primary` | `--color-primary: #6C63FF` |
| `tokens.color.textMuted` | `--color-text-muted: #6B6B8A` |
| `tokens.radius.md` | `--radius-md: 8px` |
| `tokens.spacing.unit` | `--spacing-unit: 4px` |
| `tokens.typography.fontFamily` | `--font-family: system-ui, sans-serif` |

> **Rule:** Every component references `var(--...)` only. No hard-coded values anywhere in generated output.

---

## 3. Engine Source Code

Write these files in order. Each builds on the previous one.

### 3.1 src/config/reader.ts

```typescript
import fs from 'fs-extra';
import path from 'path';

export interface CrucibleConfig {
  version: string;
  framework: string;
  theme: string;
  tokens: {
    color:      Record<string, string>;
    radius:     Record<string, string>;
    spacing:    { unit: string };
    typography: { fontFamily: string; scaleBase: string };
  };
  features: {
    hover:      boolean;
    focusRing:  boolean;
    motionSafe: boolean;
  };
  a11y: {
    focusRingStyle:  string;
    focusRingColor:  string;
    focusRingWidth:  string;
    focusRingOffset: string;
    reduceMotion:    boolean;
  };
  flags?: {
    outputDir?: string;
  };
}

export async function readConfig(configPath: string): Promise<CrucibleConfig> {
  const resolved = path.resolve(process.cwd(), configPath);
  if (!await fs.pathExists(resolved)) {
    throw new Error(`Config not found: ${resolved}\nRun: crucible init`);
  }
  return fs.readJson(resolved);
}
```

### 3.2 src/tokens/resolver.ts

```typescript
import { CrucibleConfig } from '../config/reader';

export interface ResolvedTokens {
  cssVars: Record<string, string>;
  js:      Record<string, string>;
}

export function resolveTokens(config: CrucibleConfig): ResolvedTokens {
  const cssVars: Record<string, string> = {};
  const js:      Record<string, string> = {};

  // Colors
  for (const [key, value] of Object.entries(config.tokens.color)) {
    cssVars[`--color-${kebab(key)}`] = value;
    js[`color${pascal(key)}`]        = value;
  }

  // Radius
  for (const [key, value] of Object.entries(config.tokens.radius)) {
    cssVars[`--radius-${key}`]   = value;
    js[`radius${pascal(key)}`]   = value;
  }

  // Spacing
  cssVars['--spacing-unit'] = config.tokens.spacing.unit;
  js['spacingUnit']         = config.tokens.spacing.unit;

  // Typography
  cssVars['--font-family']    = config.tokens.typography.fontFamily;
  cssVars['--font-size-base'] = config.tokens.typography.scaleBase;

  return { cssVars, js };
}

function kebab(str: string): string {
  return str.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`);
}

function pascal(str: string): string {
  return str[0].toUpperCase() + str.slice(1);
}
```

### 3.3 src/components/model.ts

```typescript
import { CrucibleConfig } from '../config/reader';
import { ResolvedTokens } from '../tokens/resolver';

export interface ComponentModel {
  name:      string;
  framework: string;
  variants:  string[];
  sizes:     string[];
  states:    string[];
  tokens:    ResolvedTokens;
  a11y: {
    focusRing:       boolean;
    focusRingColor:  string;
    focusRingWidth:  string;
    focusRingOffset: string;
    reduceMotion:    boolean;
    role?:           string;
    focusTrap?:      boolean;
    keyboardNav?:    boolean;
  };
  features: {
    hover: boolean;
  };
}

const COMPONENT_DEFAULTS: Record<string, Pick<ComponentModel, 'variants' | 'sizes' | 'states'>> = {
  Button: {
    variants: ['primary', 'secondary', 'ghost', 'danger'],
    sizes:    ['sm', 'md', 'lg'],
    states:   ['disabled', 'loading'],
  },
  Input: {
    variants: ['default', 'error'],
    sizes:    ['sm', 'md', 'lg'],
    states:   ['disabled', 'error'],
  },
  Card: {
    variants: ['default', 'hoverable', 'clickable'],
    sizes:    ['sm', 'md', 'lg'],
    states:   [],
  },
  Modal: {
    variants: ['default', 'confirm'],
    sizes:    ['sm', 'md', 'lg'],
    states:   ['open', 'closed'],
  },
  Select: {
    variants: ['default', 'error'],
    sizes:    ['sm', 'md', 'lg'],
    states:   ['disabled', 'error', 'open'],
  },
};

export function buildComponentModel(
  name:   string,
  tokens: ResolvedTokens,
  config: CrucibleConfig,
): ComponentModel {
  const defaults = COMPONENT_DEFAULTS[name];
  if (!defaults) throw new Error(`Unknown component: ${name}. Run: crucible list`);

  return {
    name,
    framework: config.framework ?? 'react',
    ...defaults,
    tokens,
    a11y: {
      focusRing:       config.features.focusRing     ?? true,
      focusRingColor:  config.a11y.focusRingColor     ?? 'var(--color-primary)',
      focusRingWidth:  config.a11y.focusRingWidth     ?? '2px',
      focusRingOffset: config.a11y.focusRingOffset    ?? '3px',
      reduceMotion:    config.a11y.reduceMotion        ?? true,
      role:            name === 'Modal'  ? 'dialog'   : undefined,
      focusTrap:       name === 'Modal'  ? true        : undefined,
      keyboardNav:     name === 'Select' ? true        : undefined,
    },
    features: {
      hover: config.features.hover ?? true,
    },
  };
}
```

### 3.4 src/registry/components.ts

```typescript
export interface ComponentDef {
  frameworks: string[];
  files: {
    react: string[];
  };
}

export const registry: Record<string, ComponentDef> = {
  Button: {
    frameworks: ['react'],
    files: { react: ['Button.tsx', 'Button.module.css', 'Button.stories.tsx'] },
  },
  Input: {
    frameworks: ['react'],
    files: { react: ['Input.tsx', 'Input.module.css', 'Input.stories.tsx'] },
  },
  Card: {
    frameworks: ['react'],
    files: { react: ['Card.tsx', 'Card.module.css', 'Card.stories.tsx'] },
  },
  Modal: {
    frameworks: ['react'],
    files: { react: ['Modal.tsx', 'Modal.module.css', 'Modal.stories.tsx'] },
  },
  Select: {
    frameworks: ['react'],
    files: { react: ['Select.tsx', 'Select.module.css', 'Select.stories.tsx'] },
  },
};
```

### 3.5 src/templates/engine.ts

```typescript
import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { ComponentModel } from '../components/model';

// Register helpers
Handlebars.registerHelper('eq',        (a, b) => a === b);
Handlebars.registerHelper('includes',  (arr, val) => arr?.includes(val));
Handlebars.registerHelper('capitalize', (str: string) => str[0].toUpperCase() + str.slice(1));
Handlebars.registerHelper('kebab',     (str: string) =>
  str.replace(/([A-Z])/g, m => `-${m.toLowerCase()}`).toLowerCase());

export async function renderComponent(
  model: ComponentModel,
): Promise<Record<string, string>> {
  const tplDir = path.join(process.cwd(), 'templates', model.framework);
  const result: Record<string, string> = {};

  const targets = [
    { tpl: `${model.name}.tsx.hbs`,          out: `${model.name}.tsx`         },
    { tpl: `${model.name}.module.css.hbs`,   out: `${model.name}.module.css`  },
    { tpl: `${model.name}.stories.tsx.hbs`,  out: `${model.name}.stories.tsx` },
  ];

  for (const { tpl, out } of targets) {
    const tplPath = path.join(tplDir, tpl);
    if (!await fs.pathExists(tplPath)) continue;
    const source   = await fs.readFile(tplPath, 'utf-8');
    const compiled = Handlebars.compile(source);
    result[out]    = compiled(model);
  }

  return result;
}
```

### 3.6 src/scaffold/writer.ts

```typescript
import fs from 'fs-extra';
import path from 'path';
import crypto from 'crypto';
import chalk from 'chalk';

const HASH_FILE = '.crucible-hashes.json';

function hashContent(content: string): string {
  return crypto.createHash('sha256').update(content).digest('hex').slice(0, 12);
}

async function loadHashes(): Promise<Record<string, string>> {
  try { return await fs.readJson(HASH_FILE); }
  catch { return {}; }
}

async function saveHashes(hashes: Record<string, string>): Promise<void> {
  await fs.writeJson(HASH_FILE, hashes, { spaces: 2 });
}

export async function writeFiles(
  files:     Record<string, string>,
  outputDir: string,
  opts:      { force?: boolean } = {},
): Promise<void> {
  await fs.ensureDir(outputDir);
  const hashes = await loadHashes();

  for (const [filename, content] of Object.entries(files)) {
    const outPath = path.join(outputDir, filename);
    const newHash = hashContent(content);

    if (await fs.pathExists(outPath) && !opts.force) {
      const currentContent = await fs.readFile(outPath, 'utf-8');
      const currentHash    = hashContent(currentContent);
      const storedHash     = hashes[filename];

      if (storedHash && currentHash !== storedHash) {
        console.log(chalk.yellow(`⚠  ${filename} has been modified. Use --force to overwrite.`));
        continue;
      }
    }

    await fs.writeFile(outPath, content, 'utf-8');
    hashes[filename] = newHash;
    console.log(chalk.green(`✓  ${filename}`));
  }

  await saveHashes(hashes);
}
```

### 3.7 src/cli/index.ts

```typescript
import { Command } from 'commander';
import path from 'path';
import chalk from 'chalk';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent } from '../templates/engine';
import { writeFiles } from '../scaffold/writer';
import { registry } from '../registry/components';

const program = new Command();

program
  .name('crucible')
  .description('Design system engine — generates owned React components')
  .version('0.1.0');

program
  .command('add <component>')
  .description('Scaffold a component into your project')
  .option('--framework <fw>',  'Target framework', 'react')
  .option('--dev',             'Output to playground/__generated__')
  .option('--force',           'Overwrite even if file has been edited')
  .option('--config <path>',   'Path to config file', 'crucible.config.json')
  .action(async (componentName, opts) => {
    if (!registry[componentName]) {
      console.error(chalk.red(`✗ Unknown component: ${componentName}`));
      console.log(`Available: ${Object.keys(registry).join(', ')}`);
      process.exit(1);
    }

    const config = await readConfig(opts.config);
    const tokens = resolveTokens(config);
    const model  = buildComponentModel(componentName, tokens, config);
    const files  = await renderComponent(model);

    const outDir = opts.dev
      ? path.join(process.cwd(), 'playground/react/src/__generated__')
      : path.join(process.cwd(), config.flags?.outputDir ?? 'src/components');

    await writeFiles(files, outDir, { force: opts.force });
    console.log(chalk.cyan(`\n⚗  ${componentName} → ${outDir}`));
  });

program
  .command('list')
  .description('Show all available components')
  .action(() => {
    console.log(chalk.cyan('Available components:'));
    for (const [name, def] of Object.entries(registry)) {
      console.log(`  ${name}  [${def.frameworks.join(', ')}]`);
    }
  });

program.parse();
```

---

## 4. Handlebars Templates

Templates receive the fully resolved `ComponentModel` — never raw config. All logic lives in `model.ts`. If you find yourself writing complex `{{#if}}` chains inside a template, that logic belongs in the model.

### 4.1 templates/react/Button.tsx.hbs

```handlebars
import React from 'react';
import styles from './Button.module.css';

export type ButtonVariant = {{#each variants}}'{{this}}'{{#unless @last}} | {{/unless}}{{/each}};
export type ButtonSize    = {{#each sizes}}'{{this}}'{{#unless @last}} | {{/unless}}{{/each}};

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:  ButtonVariant;
  size?:     ButtonSize;
  loading?:  boolean;
  children:  React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = 'primary', size = 'md', loading = false, disabled, children, className, ...props }, ref) => {
    const cls = [
      styles.btn,
      styles[`btn--${variant}`],
      styles[`btn--${size}`],
      loading  && styles['btn--loading'],
      disabled && styles['btn--disabled'],
      className,
    ].filter(Boolean).join(' ');

    return (
      <button
        ref={ref}
        className={cls}
        disabled={disabled || loading}
        aria-disabled={disabled || loading}
        aria-busy={loading}
        {...props}
      >
        {loading && <span className={styles.spinner} aria-hidden="true" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
```

### 4.2 templates/react/Button.module.css.hbs

```handlebars
/* Generated by Crucible — edit freely, re-generate with --force */

:root {
{{#each tokens.cssVars}}  {{@key}}: {{this}};
{{/each}}}

.btn {
  display:         inline-flex;
  align-items:     center;
  justify-content: center;
  gap:             calc(var(--spacing-unit) * 2);
  font-family:     var(--font-family);
  font-weight:     500;
  border:          1.5px solid transparent;
  cursor:          pointer;
  border-radius:   var(--radius-md);
  transition:      background 0.15s ease, color 0.15s ease, border-color 0.15s ease;
}

{{#if a11y.focusRing}}
.btn:focus-visible {
  outline:        {{a11y.focusRingWidth}} solid {{a11y.focusRingColor}};
  outline-offset: {{a11y.focusRingOffset}};
}
{{/if}}

{{#if a11y.reduceMotion}}
@media (prefers-reduced-motion: reduce) {
  .btn { transition: none; }
}
{{/if}}

/* Sizes */
.btn--sm { padding: 6px 12px;  font-size: 13px; }
.btn--md { padding: 10px 20px; font-size: 15px; }
.btn--lg { padding: 14px 28px; font-size: 17px; }

/* Variants */
.btn--primary   { background: var(--color-primary);   color: var(--color-surface);  border-color: var(--color-primary); }
.btn--secondary { background: var(--color-secondary); color: var(--color-primary);  border-color: var(--color-border); }
.btn--ghost     { background: transparent;            color: var(--color-text);     border-color: var(--color-border); }
.btn--danger    { background: var(--color-danger);    color: var(--color-surface);  border-color: var(--color-danger); }

{{#if features.hover}}
.btn--primary:not(:disabled):hover   { filter: brightness(1.1); }
.btn--secondary:not(:disabled):hover { background: var(--color-primary); color: var(--color-surface); }
.btn--ghost:not(:disabled):hover     { background: var(--color-secondary); }
.btn--danger:not(:disabled):hover    { filter: brightness(1.1); }
{{/if}}

/* States */
.btn--disabled, .btn:disabled { opacity: 0.45; cursor: not-allowed; }
.btn--loading  { cursor: wait; }

.spinner {
  width: 1em; height: 1em;
  border: 2px solid currentColor;
  border-top-color: transparent;
  border-radius: 50%;
  animation: spin 0.6s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg); } }
```

### 4.3 templates/react/Button.stories.tsx.hbs

```handlebars
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Crucible/{{name}}',
  component: Button,
  parameters: { layout: 'centered' },
  argTypes: {
    variant:  { control: 'select', options: [{{#each variants}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}] },
    size:     { control: 'select', options: [{{#each sizes}}'{{this}}'{{#unless @last}}, {{/unless}}{{/each}}] },
    loading:  { control: 'boolean' },
    disabled: { control: 'boolean' },
  },
};
export default meta;
type Story = StoryObj<typeof Button>;

{{#each variants}}
export const {{capitalize this}}: Story = {
  args: { variant: '{{this}}', children: '{{capitalize this}} button' },
};
{{/each}}

export const Loading: Story = {
  args: { variant: 'primary', loading: true, children: 'Loading...' },
};

export const Disabled: Story = {
  args: { variant: 'primary', disabled: true, children: 'Disabled' },
};
```

> The same `.hbs` pattern repeats for Input, Card, Modal, and Select. The model provides the correct variants/states/sizes for each — templates stay identical in structure.

---

## 5. Component Accessibility Specs

These are non-negotiable. They determine what goes into each TSX template.

### 5.1 Button

| Requirement | Implementation | Reason |
|---|---|---|
| Element | native `<button>` | Never `<div onClick>` |
| `aria-disabled` | mirrors `disabled` prop | Keeps element in tab order for AT |
| `aria-busy` | true when `loading` | Screen readers announce loading state |
| Focus ring | `focus-visible` only | Not `focus` — avoids mouse-click ring |
| Keyboard | Enter + Space activate | Native button handles this |

### 5.2 Input

| Requirement | Implementation | Reason |
|---|---|---|
| Label | `<label htmlFor={id}>` | Always linked — never placeholder-as-label |
| Error | `aria-invalid="true"` + `aria-describedby` | Error span needs `role="alert"` |
| Required | `aria-required="true"` + visual `*` | Both visual and programmatic signal |
| Hint text | `aria-describedby` on hint span | Read after label and value by AT |
| Password | `type="password"` + show/hide toggle | Toggle needs `aria-label` for its state |

### 5.3 Card

| Requirement | Implementation | Reason |
|---|---|---|
| Default | `role="article"` | Semantic landmark for screen readers |
| Clickable variant | `role="button"` or `<a>` | Never bare `div` with onClick |
| `aria-label` | Required if no heading inside | Cards with images only need a label |
| Keyboard | `tabIndex={0}` + Enter handler if clickable | Must be keyboard-reachable |
| Hover | CSS only, no JS | Works without JS, respects reduce-motion |

### 5.4 Modal — highest complexity

> **CAUTION:** Modal is the most accessibility-critical component. Missing focus trap or Escape handler = WCAG 2.4.3 failure. Use `focus-trap-react` — do not roll your own.

| Requirement | Implementation | Reason |
|---|---|---|
| `role="dialog"` | On the modal container | Required ARIA role |
| `aria-modal="true"` | On the modal container | Tells AT to ignore background |
| `aria-labelledby` | Points to modal heading id | Screen reader announces title on open |
| Focus trap | `focus-trap-react` package | Tab cycles only within modal when open |
| Initial focus | First focusable element on open | Or close button if no form inside |
| Escape key | Calls `onClose` | Universal modal dismiss expectation |
| Return focus | Back to trigger element on close | WCAG 2.4.3 — focus must return |
| Scroll lock | `overflow: hidden` on `<body>` | Prevents background scrolling |
| Backdrop click | Calls `onClose` | Optional but expected UX |

### 5.5 Select — custom combobox

> **IMPORTANT:** Do not use native `<select>` — it cannot be styled consistently. Implement the ARIA combobox pattern. This is the most complex keyboard interaction in v0.1.

| Requirement | Implementation | Reason |
|---|---|---|
| Trigger | `role="combobox"` + `aria-expanded` | Announces open/closed to AT |
| Listbox | `role="listbox"` on dropdown | Groups options semantically |
| Options | `role="option"` + `aria-selected` | Each item in the list |
| `aria-activedescendant` | ID of highlighted option | AT announces focused item |
| Arrow Down/Up | Navigate options | Standard combobox keyboard pattern |
| Enter | Select highlighted + close | Confirms selection |
| Escape | Close without selecting | Cancel |
| Home/End | Jump to first/last option | Full keyboard nav requirement |
| Type-ahead | Jump to option by typed char | Important for long lists |

---

## 6. Testing Setup

### 6.1 vitest.config.ts

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals:     true,
    environment: 'node',
    include:     ['src/__tests__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html'],
      include:  ['src/**/*.ts'],
      exclude:  ['src/__tests__/**'],
    },
  },
});
```

### 6.2 src/__tests__/resolver.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { resolveTokens } from '../../tokens/resolver';

const mockConfig = {
  tokens: {
    color:      { primary: '#6C63FF', textMuted: '#6B6B8A' },
    radius:     { sm: '4px', md: '8px' },
    spacing:    { unit: '4px' },
    typography: { fontFamily: 'system-ui', scaleBase: '16px' },
  }
} as any;

describe('resolveTokens', () => {
  it('emits CSS variable for each color token', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--color-primary']).toBe('#6C63FF');
  });

  it('kebab-cases camelCase color keys', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--color-text-muted']).toBe('#6B6B8A');
  });

  it('resolves radius tokens', () => {
    const { cssVars } = resolveTokens(mockConfig);
    expect(cssVars['--radius-md']).toBe('8px');
  });

  it('emits JS object with camelCase keys', () => {
    const { js } = resolveTokens(mockConfig);
    expect(js.colorPrimary).toBe('#6C63FF');
  });
});
```

### 6.3 src/__tests__/model.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';

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
```

### 6.4 src/__tests__/snapshots/button.test.ts

```typescript
import { describe, it, expect } from 'vitest';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';

const mockConfig = {
  framework: 'react',
  tokens: {
    color:      { primary: '#6C63FF', secondary: '#F3F2FF', surface: '#FFFFFF',
                  background: '#F8F9FA', border: '#E2E1F0', text: '#1A1A2E',
                  textMuted: '#6B6B8A', danger: '#E24B4A', success: '#1D9E75' },
    radius:     { sm: '4px', md: '8px', lg: '12px' },
    spacing:    { unit: '4px' },
    typography: { fontFamily: 'system-ui, sans-serif', scaleBase: '16px' },
  },
  features: { hover: true, focusRing: true, motionSafe: true },
  a11y: {
    focusRingColor: 'var(--color-primary)', focusRingWidth: '2px',
    focusRingOffset: '3px', reduceMotion: true,
  },
} as any;

describe('Button snapshot', () => {
  it('Button.tsx matches snapshot', async () => {
    const tokens = resolveTokens(mockConfig);
    const model  = buildComponentModel('Button', tokens, mockConfig);
    const files  = await renderComponent(model);
    expect(files['Button.tsx']).toMatchSnapshot();
    expect(files['Button.module.css']).toMatchSnapshot();
  });
});
```

> First run creates the baseline. Subsequent runs diff against it. Run `vitest --update-snapshots` only when you intentionally change a template.

### 6.5 playground/react/.storybook/main.ts

```typescript
import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/__generated__/**/*.stories.tsx'],
  addons: [
    '@storybook/addon-essentials',
    '@storybook/addon-a11y',
    '@storybook/addon-interactions',
  ],
  framework: { name: '@storybook/react-vite', options: {} },
};

export default config;
```

### 6.6 .github/workflows/chromatic.yml

```yaml
name: Chromatic
on: [push]
jobs:
  chromatic:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with: { fetch-depth: 0 }
      - run: npm ci
      - run: npm run build
      - run: npm run chromatic
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

---

## 7. Build Order — Week by Week

### Week 1 — Button, Input, Card

#### Day 1–2: Make the full pipeline work with Button

The entire pipeline must work end-to-end before you write a second component.

1. Write `src/config/reader.ts`
2. Write `src/tokens/resolver.ts`
3. Write `src/components/model.ts` — Button only
4. Write `templates/react/Button.tsx.hbs`
5. Write `templates/react/Button.module.css.hbs`
6. Write `src/templates/engine.ts`
7. Write `src/scaffold/writer.ts`
8. Write `src/cli/index.ts`
9. **Run:** `npm run build && node dist/cli/index.js add Button --dev`
10. Verify `Button.tsx` + `Button.module.css` appear in `playground/react/src/__generated__/`

#### Day 3: Tests + Storybook

1. Write `resolver.test.ts` — run `vitest`, all pass
2. Write `model.test.ts` — run `vitest`, all pass
3. Write `button.test.ts` snapshot — first run creates baseline
4. Write `Button.stories.tsx.hbs`
5. Run Storybook — all 4 variants render
6. **Open a11y panel in Storybook — zero violations required**

#### Day 4–5: Input

1. Add Input to `COMPONENT_DEFAULTS` in `model.ts`
2. Add Input to `registry/components.ts`
3. Write `Input.tsx.hbs` — label linked via `htmlFor`, error with `role="alert"`, `aria-describedby`
4. Write `Input.module.css.hbs`
5. Write `Input.stories.tsx.hbs` — default, error, disabled states
6. Run: `crucible add Input --dev`
7. Open Storybook — check a11y panel on every story

#### Day 6–7: Card

1. Add Card to model + registry
2. Write `Card.tsx.hbs` — clickable variant uses `role="button"` + `tabIndex={0}`
3. Write `Card.module.css.hbs` — hover guarded by `features.hover`
4. Write `Card.stories.tsx.hbs`
5. Run: `crucible add Card --dev` — verify in Storybook

---

### Week 2 — Modal, Select, Polish

#### Day 8–9: Modal

> Install first: `npm install focus-trap-react`

1. Add Modal to model + registry
2. Write `Modal.tsx.hbs` — `FocusTrap` wrapper, `role="dialog"`, `aria-modal`, `aria-labelledby`
3. Implement Escape key handler
4. Implement scroll lock (`overflow: hidden` on body mount/unmount)
5. Write `Modal.module.css.hbs` — overlay + panel
6. Write `Modal.stories.tsx.hbs` — controlled open/close with `useArgs`
7. Verify: Tab stays trapped inside modal when open
8. Verify: focus returns to trigger after close
9. Verify: Escape closes the modal

#### Day 10–12: Select

> Budget 3 days. The ARIA combobox pattern requires careful keyboard event handling.

1. Add Select to model + registry
2. Write `Select.tsx.hbs` — `role="combobox"`, listbox, option roles
3. Implement arrow key navigation (Up/Down, Home, End)
4. Implement type-ahead (jump to option on key press)
5. Implement Enter (select + close) and Escape (close without selecting)
6. Set `aria-activedescendant` to currently highlighted option id
7. Write `Select.module.css.hbs` — trigger + dropdown + option states
8. Write `Select.stories.tsx.hbs` — default, grouped options, error, disabled
9. Test keyboard navigation exhaustively — every key, every state

#### Day 13–14: Polish and ship

1. Run full Vitest suite — all pass
2. Open Storybook — a11y panel clean on every story, zero violations
3. Update snapshots if any templates changed intentionally
4. Push to GitHub — Chromatic runs automatically
5. Accept Chromatic baselines for all stories
6. Write `README.md` — one paragraph on Crucible, one `crucible add Button` example
7. Tag `v0.1.0`

---

> **Definition of done:** All 5 components generate. All Storybook stories render. The a11y panel is clean on every story. Chromatic has accepted baselines. Not before.

---

## 8. Commands Cheatsheet

### Daily commands

| Command | What it does |
|---|---|
| `npm run build` | Compile TypeScript to `dist/` |
| `npm run build:watch` | Watch mode — recompiles on save |
| `npm run dev` | `build:watch` + Vite playground simultaneously |
| `node dist/cli/index.js add Button --dev` | Generate Button into playground |
| `node dist/cli/index.js add Button --force` | Overwrite even if user edited the file |
| `node dist/cli/index.js list` | Show all available components |
| `npm run test` | Run Vitest suite |
| `npm run test:coverage` | Tests with coverage report |
| `vitest --update-snapshots` | Commit new snapshot baselines |
| `npm run storybook` | Start Storybook dev server |
| `npm run chromatic` | Push stories to Chromatic (needs token in env) |

### Key files

| File | Purpose |
|---|---|
| `crucible.config.json` | User-facing design token config |
| `src/config/reader.ts` | Loads + parses config |
| `src/tokens/resolver.ts` | Token → CSS var conversion |
| `src/components/model.ts` | IR — normalized ComponentModel |
| `src/registry/components.ts` | Component → file output map |
| `src/templates/engine.ts` | Handlebars template renderer |
| `src/scaffold/writer.ts` | File writer with hash protection |
| `src/cli/index.ts` | CLI entry — wires all layers |
| `templates/react/*.hbs` | Per-component Handlebars templates |
| `playground/react/src/__generated__/` | Dev output — watched by Vite |
| `.crucible-hashes.json` | Generation hashes — do not delete |

---

*Crucible v0.1 — Design System Engine — March 2026*
