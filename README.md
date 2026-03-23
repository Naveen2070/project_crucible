# ⚗ Crucible — Design System Engine

> **Generated once. Yours forever.**
>
> A code-generation engine that scaffolds production-ready components into your project. No
> wrappers, no black-box libraries. You own every file generated.

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

| Feature             | Description                                |
| ------------------- | ------------------------------------------ |
| **Multi-Framework** | React, Vue 3, and Angular support          |
| **Style Systems**   | CSS Modules, SCSS, or Tailwind CSS v4      |
| **Theme Presets**   | Built-in `minimal` and `soft` presets      |
| **Dark Mode**       | Automatic OKLCH-based dark mode derivation |
| **Accessibility**   | WCAG-compliant component scaffolding       |
| **User Ownership**  | Hash-based protection for user edits       |

---

## Quick Start

### 1. Initialize

```bash
npx crucible init
```

Creates a `crucible.config.json` with your theme, tokens, and style system preferences.

### 2. Add Components

```bash
npx crucible add Button
npx crucible add Input Card Modal Select
```

### 3. Customize

Update `crucible.config.json` and regenerate, or edit generated files directly — they're yours.

---

## Available Components

| Component | Description                             |
| --------- | --------------------------------------- |
| `Button`  | Multi-variant button with loading state |
| `Input`   | Text input with validation states       |
| `Card`    | Container with hover/clickable variants |
| `Modal`   | Dialog with focus trap                  |
| `Select`  | Dropdown with keyboard navigation       |

---

## Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md) — System design and data flow
- [CONTRIBUTING.md](./CONTRIBUTING.md) — Contribution guidelines
- [ROADMAP.md](./ROADMAP.md) — Future plans

---

## CLI Reference

### Generate Components

```bash
crucible add Button                    # Single component
crucible add Button Input Card         # Multiple components
crucible add Button --stories          # With Storybook story
crucible add Button --framework vue    # Vue framework
crucible add Button --dev             # Output to playground
```

### Setup & Configuration

```bash
crucible init     # Scaffold config file
crucible doctor   # Validate setup
crucible list     # Show available components
crucible eject   # Copy preset to config
```

### Tokens

```bash
crucible tokens           # Regenerate tokens.css
crucible tokens --force    # Force overwrite
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

| Version | Status    | Description                                    |
| ------- | --------- | ---------------------------------------------- |
| v1.0.0  | ✅ Stable | Core engine with 3 frameworks, 3 style systems |

See [ROADMAP.md](./ROADMAP.md) for future plans.
