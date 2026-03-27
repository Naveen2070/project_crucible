# Contributing to Crucible

> **Crucible — Code Generation Engine that generates style system/spec-based components**

Welcome! This guide covers everything you need to set up, run, and contribute to Crucible.

---

## Who Should Contribute?

Crucible is ideal for contributors interested in:

- Component libraries and design systems
- CLI tooling development
- Template engines (Handlebars)
- Multi-framework development (React, Vue, Angular)

**If you're new to the codebase, start with:**

- `registry/` — low complexity, safe contributions
- `templates/` — template-only changes, no engine risk
- Adding a new component — well-defined steps

**Avoid starting with:**

- Core engine changes (`src/tokens/`, `src/components/model.ts`)
- Token resolver logic — requires deep understanding

---

## Architecture Overview

Before contributing to core systems, read:

- [ARCHITECTURE.md](./ARCHITECTURE.md) — system design and data flow
- Core Pipeline: Config → Tokens → Model (IR) → Templates → Writer

---

## Core Principles

Crucible has strong architectural opinions. Following these prevents bad contributions:

- **Templates must remain logic-light** — enforced by `npm run audit:templates`
- **All component behavior is derived from ComponentMeta** — no special-casing in engine
- **No framework-specific logic in core modules** — framework differences live in templates only
- **Deterministic output is required** — all behavior must be snapshot tested

---

## Contribution Workflow

### 1. Fork and Branch

```bash
git checkout -b feat/textarea-component
```

### 2. Make Your Changes

Follow the architecture principles and make your changes.

### 3. Run Quality Checks

```bash
npm test                    # All tests must pass
npm run audit:templates     # Templates must be logic-free
npm run build               # No TypeScript errors
```

### 4. Commit with Clear Messages

```bash
git commit -m "feat: add textarea component"
git commit -m "fix: correct token resolution bug"
git commit -m "docs: update contributing guide"
```

### 5. Open a Pull Request

Include:

- Description of changes
- Screenshots (if UI-related)
- Linked issue (if applicable)
- Test results from quality checks

---

## Definition of Done

A contribution is considered complete when:

- [ ] All tests pass (`npm test`)
- [ ] New features include tests
- [ ] Templates pass audit (`npm run audit:templates`)
- [ ] No TypeScript errors (`npm run build`)
- [ ] Playground works (`npm run dev`)

---

## Good First Contributions

**Recommended starting points:**

- Adding a new component (Textarea, Badge, Checkbox)
- Improving documentation
- Writing missing tests for existing features
- Fixing small bugs in CLI commands

**Need architecture review first:**

- Core engine changes
- Token resolver modifications
- IR model restructuring

---

## Versioning

Crucible follows Semantic Versioning:

| Type    | Description                            |
| ------- | -------------------------------------- |
| `patch` | Bug fixes                              |
| `minor` | New features (backward compatible)     |
| `major` | Breaking changes (requires discussion) |

**Breaking changes require opening an issue first before submitting PR.**

---

## Quick Start

```bash
# Clone and install
npm install

# Verify setup
npm test
```

---

## Project Structure

```
crucible/
├── src/
│   ├── cli/
│   │   ├── index.ts          # CLI entry point + all commands
│   │   ├── doctor.ts         # crucible doctor command
│   │   ├── init.ts           # crucible init command
│   │   ├── tailwind.ts       # Tailwind auto-setup
│   │   └── tokens.ts         # crucible tokens command
│   ├── components/
│   │   └── model.ts          # ComponentModel (IR layer)
│   ├── config/
│   │   ├── reader.ts         # Config file loader
│   │   ├── validator.ts       # Schema validation
│   │   └── schema.json        # AJV schema
│   ├── core/
│   │   └── enums.ts           # Framework, StyleSystem, ComponentName
│   ├── registry/
│   │   ├── components.ts      # Component registry
│   │   ├── path-generator.ts  # Dynamic file path generation
│   │   ├── manifests/
│   │   │   └── defaults.ts    # COMPONENT_DEFAULTS (ComponentMeta)
│   │   └── peer-deps.ts       # Peer dependency mapping
│   ├── scaffold/
│   │   └── writer.ts          # File writer + hash system
│   ├── templates/
│   │   ├── engine.ts          # Handlebars engine
│   │   ├── react/
│   │   ├── vue/
│   │   ├── angular/
│   │   └── shared/            # Shared partials
│   ├── themes/
│   │   └── index.ts           # Theme presets
│   ├── tokens/
│   │   ├── resolver.ts        # Token resolution
│   │   └── dark-resolver.ts   # Dark mode derivation
│   └── __tests__/
│       ├── a11y/              # Accessibility tests
│       ├── snapshots/          # Snapshot tests
│       └── templates/          # Template audit
├── scripts/
│   ├── audit-templates.ts      # Template logic enforcement
│   ├── e2e.ts                 # End-to-end tests
│   ├── generate-playground.ts  # Playground scaffold
│   └── open-playground.ts     # Open Storybook
├── templates/                  # Handlebars templates (user-facing)
│   ├── react/
│   ├── vue/
│   ├── angular/
│   └── shared/
├── playground/                 # Dev playgrounds
│   ├── react/
│   ├── vue/
│   └── angular/
└── package.json
```

---

## Development Commands

### Build & Type Check

```bash
npm run build          # Compile TypeScript
```

### Development

```bash
npm run dev            # Watch mode + playground (concurrent)
```

### Testing

```bash
npm test               # Run all tests (230 tests, 24 files)
npm run test:e2e       # Run E2E script (19 phases)
npm run test:watch    # Watch mode
```

### Code Quality

```bash
npm run audit:templates  # Check templates for logic violations
                          # Runs automatically on prebuild
```

---

## CLI Commands Reference

### Generate Components

```bash
# Single component
crucible add Button                    # or: crucible a Button

# Multiple components
crucible add Button Input Card

# Add all components
crucible add -a                        # or: crucible a -a

# With style override
crucible add Button -s tailwind        # css, tailwind, scss

# With theme override
crucible add Button -t soft            # minimal, soft

# With framework
crucible add Button --framework vue    # or: -f vue

# With stories
crucible add Button --stories

# Output to playground
crucible add Button --dev

# Interactive mode
crucible add
```

### Setup & Configuration

```bash
crucible init              # Scaffold config file (alias: i)
crucible doctor            # Validate setup (alias: d)
crucible eject            # Copy preset to config (alias: e)
crucible list             # Show available components (alias: l)
crucible config           # Show current config (alias: cfg)
```

### Tokens

```bash
crucible tokens              # Regenerate tokens.css (alias: t)
crucible tokens --force      # Force overwrite (alias: t -f)
crucible tokens --dry-run    # Preview
```

### Playground

```bash
crucible pg:gen             # Generate all 3 frameworks (alias: pg)
crucible pg:gen --force     # Clean + regenerate (alias: pg -f)
crucible pg:open            # Open Storybook (alias: po)
crucible pg:dev             # Start dev server (alias: pd)
crucible pg:clean           # Clean all playgrounds (alias: pcl)
```

### Cleanup

```bash
crucible clean              # Remove generated files (alias: c)
crucible clean --all         # Also remove config (alias: c -a)
```

---

## Adding a New Component

### Step 1: Add to Enum

```typescript
// src/core/enums.ts
export enum ComponentName {
  Button = 'Button',
  Input = 'Input',
  Card = 'Card',
  Dialog = 'Dialog',
  Select = 'Select',
  Textarea = 'Textarea', // NEW
}
```

### Step 2: Add to ComponentMeta

```typescript
// src/registry/manifests/defaults.ts
export const COMPONENT_DEFAULTS: Record<string, ComponentMeta> = {
  // ...existing components...
  [ComponentName.Textarea]: {
    variants: ['default', 'error'],
    sizes: ['sm', 'md', 'lg'],
    states: ['disabled', 'error'],
    props: ['label', 'hint', 'placeholder', 'rows'],
    prefix: 'textarea',
    a11y: { role: 'textbox' },
  },
};
```

### Step 3: Add Tailwind Variants (if needed)

```typescript
// src/registry/manifests/defaults.ts
export const TAILWIND_VARIANT_DEFAULTS: Record<string, Record<string, string>> = {
  // ...existing...
  [ComponentName.Textarea]: {
    default: 'border-[var(--color-border)] focus:border-[var(--color-primary)]',
    error: 'border-[var(--color-danger)] focus:border-[var(--color-danger)]',
  },
};
```

### Step 4: Create Templates

```
templates/
├── react/
│   ├── css/
│   │   └── Textarea/
│   │       ├── Textarea.tsx.hbs
│   │       └── Textarea.module.css.hbs
│   ├── tailwind/
│   │   └── Textarea/
│   │       └── Textarea.tsx.hbs
│   └── scss/
│       └── Textarea/
│           └── Textarea.module.scss.hbs
├── vue/
│   └── Textarea/
│       └── Textarea.vue.hbs
└── angular/
    └── textarea/
        ├── textarea.component.ts.hbs
        ├── textarea.component.html.hbs
        └── textarea.component.css.hbs
```

### Step 5: Add Tests

```typescript
// src/__tests__/snapshots/textarea.test.ts
import { describe, it, expect } from 'vitest';
import { renderComponent } from '../../templates/engine';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';

describe('Textarea', () => {
  it('renders correctly with CSS', () => {
    const model = buildComponentModel('Textarea', tokens, config, false);
    const files = await renderComponent(model);
    expect(files['Textarea.tsx']).toMatchSnapshot();
  });
});
```

### Step 6: Run Tests

```bash
npm test -- --update  # Update snapshots
npm test              # Verify all pass
```

---

## ComponentMeta Field Reference

When adding a component, use these fields:

```typescript
interface ComponentMeta {
  // Visual variants (e.g., primary, secondary, ghost)
  variants: string[];

  // Size options (e.g., sm, md, lg)
  sizes: string[];

  // Behavioral states (e.g., disabled, loading, open)
  states: string[];

  // Props this component accepts — controls has* flag derivation
  // Examples: 'required', 'hint', 'label', 'placeholder', 'id', 'title'
  props: string[];

  // CSS class prefix (e.g., 'btn', 'input')
  prefix: string;

  // Set true for Card, Dialog — components that don't accept className
  noClassName?: boolean;

  // Explicit behaviors — controls hasOutputClose, focusTrap, scrollLock
  behaviours?: ('closeable' | 'focusTrap' | 'scrollLock')[];

  // Component-specific accessibility
  a11y?: {
    role?: string; // ARIA role (e.g., 'dialog', 'textbox')
    focusTrap?: boolean; // Dialog needs this
    keyboardNav?: boolean; // Select needs this
    passwordToggle?: boolean; // Input needs this
  };
}
```

### has\* Flag Derivation

These flags are automatically derived from ComponentMeta:

| Flag             | Derivation                                               |
| ---------------- | -------------------------------------------------------- |
| `hasVariant`     | `variants.length > 0`                                    |
| `hasSize`        | `sizes.length > 0`                                       |
| `hasLoading`     | `states.includes('loading')`                             |
| `hasDisabled`    | `states.includes('disabled')`                            |
| `hasRequired`    | `props.includes('required')`                             |
| `hasError`       | `states.includes('error')`                               |
| `hasHint`        | `props.includes('hint')`                                 |
| `hasLabel`       | `props.includes('label')`                                |
| `hasTitle`       | `props.includes('title')`                                |
| `hasIsOpen`      | `states.includes('open')` or `states.includes('closed')` |
| `hasClassName`   | `!noClassName`                                           |
| `hasId`          | `props.includes('id')`                                   |
| `hasOutputClose` | `behaviours?.includes('closeable')`                      |
| `hasPlaceholder` | `props.includes('placeholder')`                          |

---

## Template Logic Rules

Templates must contain **only** these patterns:

### Permitted

```handlebars
{{name}}                           {{!-- Interpolation --}}
{{#if hasVariant}}...{{/if}}       {{!-- Boolean conditional --}}
{{#each variants}}...{{/each}}      {{!-- Loop --}}
{{> shared/focus-ring}}            {{!-- Partial --}}
{{#each items as |item|}}...{{/each}} {{!-- Block params --}}
```

### Forbidden

```handlebars
{{#if variant === 'primary'}}      {{!-- Comparisons --}}
{{condition ? a : b}}               {{!-- Ternary --}}
{{else if condition}}               {{!-- Else-if chains --}}
{{ComponentName.Button}}             {{!-- Enum references --}}
{{crucible.config.theme}}           {{!-- Config references --}}
{{str + 'suffix'}}                  {{!-- String manipulation --}}
```

### Running the Audit

```bash
npm run audit:templates
```

This script (`scripts/audit-templates.ts`) checks all templates against prohibited patterns and runs
automatically on `npm run build`.

---

## Template Style Guidelines

### CSS Class Naming (BEM)

All components use **BEM (Block Element Modifier)** naming consistently:

```css
/* Block */
.card {
}

/* Elements (nested in SCSS, or flat with __ in CSS) */
.card__header {
}
.card__footer {
}
.card__title {
}
.card__content {
}

/* Modifiers */
.card--hoverable {
}
.card--clickable {
}
```

**Angular Note:** Angular templates use component-prefixed classes (`.card-header`, `.card-footer`)
for view encapsulation compatibility.

### CSS Variable Usage

Always use CSS custom properties for component-specific values:

```css
/* CORRECT */
.card {
  padding: var(--card-header-padding);
  border-radius: var(--card-border-radius);
}

/* WRONG — hardcoded values */
.card {
  padding: 24px;
  border-radius: 8px;
}
```

### Compound Component Classes

When adding compound sub-components, ALWAYS add corresponding CSS classes:

```tsx
// Card.tsx.hbs
export const CardHeader = ({ children, className }) => (
  <div className={[styles.header, className].filter(Boolean).join(' ')}>{children}</div>
);

export const CardFooter = ({ children, className }) => (
  <div className={[styles.footer, className].filter(Boolean).join(' ')}>{children}</div>
);
```

**You MUST also add these classes to the CSS:**

```css
/* Card.module.css.hbs */
.header {
  padding: var(--card-header-padding);
}

.footer {
  padding: var(--card-footer-padding);
}
```

### Tailwind Templates

Use **CSS-in-Tailwind** approach — reference CSS variables via arbitrary value syntax:

```html
<!-- CORRECT — uses CSS variables -->
class="bg-[var(--color-surface)] rounded-[var(--radius-lg)]"

<!-- WRONG — hardcoded Tailwind values when token exists -->
class="bg-white rounded-lg"
```

### Border Width

| Style System | Syntax                |
| ------------ | --------------------- |
| CSS          | `border: 1px solid`   |
| SCSS         | `border: 1.5px solid` |
| Tailwind     | `border-[1.5px]`      |

**Important:** Use `border-[1.5px]` NOT `border-1.5` in Tailwind templates.

### Checklist for New Component Templates

When adding a new component, verify:

- [ ] All compound sub-components have corresponding CSS classes
- [ ] All padding/margin values use CSS variables (`var(--component-*)`)
- [ ] Border radius uses CSS variables (`var(--radius-*)`)
- [ ] Border width follows standard (1px CSS, 1.5px SCSS/Tailwind)
- [ ] Focus ring uses `{{a11y.focusRingColor}}` consistently
- [ ] Class names follow BEM convention
- [ ] Tailwind templates use `[var(--token)]` syntax for design tokens

### Quick Reference: Component Token Variables

| Component | Token Variables                                                                                    |
| --------- | -------------------------------------------------------------------------------------------------- |
| Card      | `--card-header-padding`, `--card-content-padding`, `--card-footer-padding`, `--card-border-radius` |
| Dialog    | `--Dialog-padding`, `--Dialog-overlay-bg`, `--Dialog-border-radius`, `--Dialog-shadow`             |
| Button    | `--btn-border-radius`, `--btn-font-weight`, `--btn-transition`                                     |
| Input     | `--input-height`, `--input-border-radius`, `--input-border-color`, `--input-transition`            |
| Select    | `--select-height`, `--select-border-radius`, `--select-border-color`                               |

---

## Testing Guide

### Test File Map

| File                    | What It Tests                               |
| ----------------------- | ------------------------------------------- |
| `resolver.test.ts`      | Theme presets, deep merge, token resolution |
| `dark-resolver.test.ts` | OKLCH color derivation                      |
| `model.test.ts`         | ComponentModel building, has\* flags        |
| `config.test.ts`        | Config schema validation                    |
| `registry.test.ts`      | Path generation for all frameworks          |
| `doctor.test.ts`        | Circular ref detection                      |
| `writer.test.ts`        | Hash system, force/dry-run flags            |
| `snapshots/*.test.ts`   | Full component output                       |
| `a11y/*.test.ts`        | Accessibility compliance                    |

### Running Specific Tests

```bash
# Unit tests only
npm test -- src/__tests__/model.test.ts

# Snapshot tests only
npm test -- src/__tests__/snapshots/

# A11y tests
npm test -- src/__tests__/a11y/

# Update snapshots
npm test -- --update
```

### Adding Snapshot Tests

1. Create test file in `src/__tests__/snapshots/`
2. Import `renderComponent` and `buildComponentModel`
3. Render the component
4. Assert output matches snapshot
5. Run `npm test -- --update` to generate initial snapshot

---

## Playground Development

### Generate Playgrounds

```bash
npm run pg:gen      # Generate all 3 frameworks
npm run pg:react    # React only
npm run pg:vue      # Vue only
npm run pg:angular  # Angular only
```

### Run Playgrounds

```bash
npm run dev         # Runs all 3 concurrently
```

### Access

- React: http://localhost:3000
- Vue: http://localhost:5173
- Angular: http://localhost:4200

---

## Code Style

### Formatting

Crucible uses Prettier for code formatting. Format before committing:

```bash
npx prettier --write .
```

### TypeScript

- Strict mode enabled
- No `any` types
- Explicit return types on exported functions

### Testing

- All new features require tests
- Snapshot tests for component output
- Unit tests for pure functions

---

## Common Tasks

### Add a New CLI Flag

1. Add option to command in `src/cli/index.ts`
2. Add to `addCommand` type interface if needed
3. Add test for the flag behavior

### Add a New Token

1. Add to theme preset in `src/themes/`
2. Add to `ColorTokens` or `RadiusTokens` interface
3. Add resolver logic if transformation needed
4. Add test for resolution

### Add a New Template Helper

1. Register in `src/templates/engine.ts`
2. Add TypeScript types for the helper
3. Add test for the helper output

---

## Troubleshooting

### Build fails with template errors

```bash
npm run audit:templates
```

### Tests are failing after template changes

```bash
npm test --update
```

### Playground not reflecting changes

```bash
npm run pg:gen
```

### TypeScript errors in generated files

The playground files in `playground/react/src/__generated__/` are generated. They're expected to
have type errors until the playground has proper CSS module typing set up.

---

## Getting Help

- Open an issue at https://github.com/crucible-ui/crucible/issues
- Check the [ARCHITECTURE.md](./ARCHITECTURE.md) for system details
