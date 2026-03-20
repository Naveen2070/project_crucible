# ⚗ Crucible — Design System Engine

Crucible is a CLI code-generation engine that scaffolds native, fully-editable React components directly into your project. 

**No wrappers. No runtime dependency.**

Crucible's core philosophy is that you should own the code. It is not an npm component library — it's a code generator that writes source files into your project, styling them according to a `crucible.config.json` file. You get highly accessible, perfectly styled components that you can completely modify without dealing with a black box.

## Current Status

**v0.1** — React only, 5 components (Button, Input, Card, Modal, Select), full accessibility, token-driven.
Supports both **Vanilla CSS Modules** and **Tailwind CSS**.

## Installation & Usage

You can use Crucible via `npx` without installing it globally:

```bash
# Scaffold a new configuration file
npx crucible init

# Add a component to your project
npx crucible add Button
npx crucible add Input
npx crucible add Card
npx crucible add Modal
npx crucible add Select

# List all available components
npx crucible list
```

## How It Works

Crucible operates in four sequence layers:
1. **Configuration (`crucible.config.json`)**: You define your tokens (colors, typography, spacing) and options (like CSS Modules vs Tailwind).
2. **Token Resolver**: Crucible resolves these tokens into CSS Variables and a JavaScript theme object.
3. **Template Engine**: It runs through Handlebars templates to generate the component files.
4. **CLI Scaffold**: It writes the final `.tsx`, `.module.css` (or Tailwind classes), and `.stories.tsx` files directly into your project directory.

Since it writes actual source code into your repository, you are free to customize and extend the components to your heart's content!

## Accessibility

All generated components adhere to strict accessibility requirements:
- Semantic HTML tags (`<button>`, `<dialog>`, etc.)
- Full keyboard navigation (focus traps for Modals, type-ahead for Selects)
- WAI-ARIA roles, states, and properties
- Visible focus rings that are customizable via configuration

## License

MIT
