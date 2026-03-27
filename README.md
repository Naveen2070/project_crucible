# ⚗ Crucible — Code Generation Engine

> **Generated once. Yours forever.**
>
> A code generation engine that scaffolds production-ready, style system/spec-based components into
> your project. No wrappers, no black-box libraries. You own every file generated.

[![npm version](https://img.shields.io/npm/v/crucible.svg)](https://www.npmjs.com/package/crucible)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)

---

## Why Crucible?

Most design systems install as npm packages — you're locked into their API and bundle size forever.
**Crucible is different.**

It generates pure source code that lives in your project. Once generated, Crucible has **zero
runtime footprint**. You read, edit, and extend every line.

```bash
# Generate a Button component
npx crucible add Button

# Output: Button/Button.tsx, Button/Button.module.css
# That's it. No runtime dependencies. Pure code you own.
```

---

## Features

| Feature                | Description                                   |
| ---------------------- | --------------------------------------------- |
| **Multi-Framework**    | React, Vue 3, and Angular support             |
| **Style Systems**      | CSS Modules, SCSS, or Tailwind CSS v4         |
| **Theme Presets**      | Built-in `minimal` and `soft` presets         |
| **Dark Mode**          | Automatic OKLCH-based dark mode derivation    |
| **Accessibility**      | WCAG 2.1 AA-compliant with ARIA support       |
| **Component Patterns** | Professional patterns with variants and sizes |
| **User Ownership**     | Hash-based protection for user edits          |

---

## Quick Start

### 1. Initialize

```bash
npx crucible init
```

Creates a `crucible.config.json` with your theme, tokens, and style system preferences.

### 2. Add Components

```bash
npx crucible add Button                    # Single component
npx crucible add Button Input Card         # Multiple components
npx crucible add -a                        # Add all components
npx crucible add Button -s tailwind        # Override style
npx crucible add Button -t soft            # Override theme
```

### 3. Customize

Update `crucible.config.json` and regenerate, or edit generated files directly — they're yours.

---

## Available Components

| Component | Description                                    |
| --------- | ---------------------------------------------- |
| `Button`  | 7 variants, 5 sizes, compound components       |
| `Input`   | Text input with validation, label, hint, error |
| `Card`    | Container with header, description, action     |
| `Dialog`  | Modal with focus trap, description support     |
| `Select`  | Dropdown with keyboard navigation, groups      |

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and data flow
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines
- [ROADMAP.md](./ROADMAP.md) — Future plans

---

## CLI Reference

### Generate Components

```bash
crucible add Button                    # Single component (alias: a)
crucible add Button Input Card         # Multiple components
crucible add -a                        # Add all components
crucible add Button --stories          # With Storybook story
crucible add Button --framework vue    # Vue framework
crucible add Button --dev             # Output to playground
crucible add Button -s tailwind        # Override style system
crucible add Button -t soft            # Override theme
```

### Setup & Configuration

```bash
crucible init     # Scaffold config file (alias: i)
crucible doctor   # Validate setup (alias: d)
crucible list     # Show available components (alias: l)
crucible eject   # Copy preset to config (alias: e)
crucible config   # Show current config (alias: cfg)
```

### Tokens

```bash
crucible tokens           # Regenerate tokens.css (alias: t)
crucible tokens --force    # Force overwrite (alias: t -f)
```

### Playground

```bash
crucible pg               # Generate playground (alias: pg)
crucible pg --force        # Clean + regenerate (alias: pg -f)
crucible po               # Open Storybook (alias: po)
crucible pd               # Start dev server (alias: pd)
crucible pcl              # Clean all playgrounds (alias: pcl)
```

### Cleanup

```bash
crucible clean           # Remove generated files (alias: c)
crucible clean --all     # Also remove config (alias: c -a)
```

---

## Architecture

```
Config → Tokens → Model (IR) → Templates → Writer
```

1. **Config Layer** — User preferences in `crucible.config.json`
2. **Token Resolver** — Maps tokens to CSS variables
3. **Component Model** — Normalizes data for templates
4. **Template Engine** — Handlebars-driven generation
5. **File Writer** — Writes files with hash protection

See [ARCHITECTURE.md](./ARCHITECTURE.md) for details.

---

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before submitting PRs.

**Requirements:**

- All tests pass (`npm test`)
- Templates pass audit (`npm run audit:templates`)
- No TypeScript errors (`npm run build`)

---

## License

[MIT License](./LICENSE) — © 2026 [Naveen R](https://github.com)

---

## Project Status

| Version | Status    | Description                                                                   |
| ------- | --------- | ----------------------------------------------------------------------------- |
| v1.0.0  | ✅ Stable | Core engine with 3 frameworks, 3 style systems, 230 unit tests + 19 E2E tests |

See [ROADMAP.md](./ROADMAP.md) for future plans.
