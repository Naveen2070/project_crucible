# ⚗ Crucible — Design System Engine

> **Generated once. Yours forever.**
>
> A code-generation engine that scaffolds native, fully-editable React components directly into your
> project — driven by a JSON config file. No wrappers, no black-box libraries. You own every file
> generated.

## 🌟 The "No-Wrapper" Philosophy

Most design systems install as npm packages — you import their components and are locked into their API and bundle size forever. **Crucible is different.**

It generates pure source code (React + TypeScript + CSS Modules or Tailwind) that lives in your project. Once generated, Crucible has **zero footprint** in your runtime. You read, edit, and extend every line of code.

## 🚀 Quick Start

### 1. Initialize your project
```bash
npx crucible init
```
This creates a `crucible.config.json` where you can define your theme, tokens (colors, radius, spacing), and preferred style system.

### 2. Scaffold a component
```bash
npx crucible add Button
```
This reads your config and writes `Button/Button.tsx` and `Button/Button.module.css` (or Tailwind classes) directly into your components folder.

### 3. Customize anything
Need to change the primary color? Update your config and run `add` again. Need a special one-off behavior for a specific button? Just edit the generated `.tsx` file — it's yours.

## 🛠 Features

- **Frameworks:** React, Vue 3, and Angular (Unified Hybrid Pattern)
- **Style Systems:** CSS Modules, SCSS, or Tailwind CSS v4 (auto-setup included!)
- **Themes:** Built-in `minimal` and `soft` presets with easy customization.
- **Dark Mode:** Automatic OKLCH-based dark mode derivation.
- **Accessibility:** WCAG-compliant components (Button, Input, Card, Modal, Select).
- **Tooling:** Interactive CLI, Storybook support, and hash-based file protection.

## 📖 Commands

| Command | Description |
| :--- | :--- |
| `init` | Create a default `crucible.config.json` interactively. |
| `add <name>` | Scaffold a component (e.g., `Button`, `Select`). |
| `list` | Show all available components. |
| `eject` | Eject built-in theme tokens into your local config. |

## 🏗 Architecture

Crucible operates in four layers:
1. **Config Layer:** User intentions in `crucible.config.json`.
2. **Token Resolver:** Maps tokens to CSS variables and JS objects (includes dark mode).
3. **Template Engine:** Handlebars-driven generation per style system.
4. **CLI Scaffold:** Writes files with SHA-256 hash protection to prevent accidental overwrites.

---

MIT License • © 2026 Crucible Team
