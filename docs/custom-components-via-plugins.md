# How-To: Add a Custom Component via a Plugin

Crucible is **plug-and-play**. You can add your own components — that show up in `crucible list`
and `crucible add` exactly like the built-ins — **without forking or changing the engine**. You
just drop a small folder into your project and Crucible discovers it automatically.

This guide walks through building a working `Pill` component plugin from scratch, then documents
the full manifest and template contract.

---

## How it works

On every run, Crucible loads:

1. The built-in **core** plugin (the 25 bundled components), then
2. Every folder under **`.crucible/plugins/*`** in your project that contains a `plugin.json`.

Each plugin contributes one or more **component manifests** (JSON specs) plus the **Handlebars
templates** that render them. If a plugin component shares an `id` with an existing one, the
later-loaded plugin **overrides** it (you'll see a collision warning) — so you can also use a
plugin to customize a built-in component.

A plugin is just files on disk — no build step, no `npm publish` required.

---

## Folder layout

Create this structure inside your project (the project that has `crucible.config.json`):

```
.crucible/
└── plugins/
    └── my-kit/                      # one folder per plugin (any name)
        ├── plugin.json              # the plugin manifest
        ├── components/
        │   └── pill.json            # one manifest per component
        └── templates/               # templatesDir (default "./templates")
            └── react/
                └── css/
                    └── Pill/
                        ├── Pill.tsx.hbs
                        └── Pill.module.css.hbs
```

The template path convention is:

```
<templatesDir>/<framework>/<styleSystem>/<ComponentId>/<file>.hbs
```

---

## Step 1 — `plugin.json`

```json
{
  "id": "my-kit",
  "name": "My Component Kit",
  "version": "1.0.0",
  "engineVersion": ">=1.1.0",
  "description": "Custom components for my project",
  "components": ["components/pill.json"],
  "templatesDir": "./templates"
}
```

| Field           | Required | Notes                                                                                      |
| --------------- | :------: | ------------------------------------------------------------------------------------------ |
| `id`            |    ✅    | Unique plugin id.                                                                          |
| `name`          |    ✅    | Human-readable name.                                                                       |
| `version`       |    ✅    | Your plugin's version.                                                                     |
| `engineVersion` |          | Semver range your plugin needs (e.g. `>=1.1.0`). If the installed Crucible is older, the plugin is **skipped with a warning**. |
| `description`   |          | Shown in tooling.                                                                          |
| `components`    |    ✅    | Array of paths (relative to the plugin folder) to component manifests.                     |
| `templatesDir`  |          | Path to your templates root, relative to the plugin folder. Defaults to `./templates`.     |
| `frameworks`    |          | Advanced: paths to custom framework manifests (to add a brand-new target framework).       |

---

## Step 2 — the component manifest (`components/pill.json`)

```json
{
  "id": "Pill",
  "name": "Pill",
  "description": "A small rounded label",
  "frameworks": ["react", "vue", "angular"],
  "styleSystems": ["css", "scss", "tailwind"],
  "variants": ["default"],
  "sizes": [],
  "states": [],
  "props": [],
  "prefix": "pill",
  "tailwindDefaults": {}
}
```

| Field              | Required | What it does                                                                                          |
| ------------------ | :------: | ----------------------------------------------------------------------------------------------------- |
| `id`               |    ✅    | **PascalCase** component name. This is what users type: `crucible add Pill`.                          |
| `name`             |    ✅    | Display name.                                                                                         |
| `frameworks`       |    ✅    | Which of `react` / `vue` / `angular` you provide templates for.                                       |
| `styleSystems`     |    ✅    | Which of `css` / `scss` / `tailwind` you provide templates for.                                       |
| `variants`         |    ✅    | Visual variants (drives `hasVariant`, the `variants` array, and the `--variant` typings).             |
| `sizes`            |    ✅    | Size options (drives `hasSize`).                                                                       |
| `states`           |    ✅    | State flags. Recognized values toggle model booleans — e.g. `loading`→`hasLoading`, `disabled`→`hasDisabled`, `error`→`hasError`, `open`/`closed`→`hasIsOpen`. |
| `props`            |    ✅    | Recognized prop names toggle booleans — e.g. `id`→`hasId`, `label`→`hasLabel`, `hint`→`hasHint`, `title`→`hasTitle`, `placeholder`→`hasPlaceholder`, `required`→`hasRequired`, `onClick`→`hasOnClick`, `href`→`hasHref`. |
| `prefix`           |    ✅    | CSS/class prefix, available as `{{prefix}}` in templates (e.g. `pill`).                                |
| `noClassName`      |          | Set `true` to drop the `className` passthrough (`hasClassName` becomes false).                        |
| `behaviours`       |          | e.g. `["closeable"]` → `hasOutputClose` (Angular `@Output() close`).                                  |
| `a11y`             |          | `{ role, focusTrap, keyboardNav, passwordToggle, dynamicRowCount }` — surfaced under `model.a11y`.    |
| `utils`            |          | Names of shared util files to copy alongside the component.                                            |
| `dependencies`     |          | Other component ids to auto-scaffold first (e.g. Dialog depends on Button).                            |
| `peerDependencies` |          | `{ "<framework>": ["pkg"] }` npm packages to offer to install.                                         |
| `tailwindDefaults` |          | Map of variant → Tailwind classes; surfaced as `model.tailwindVariants` for your tailwind template.   |
| `extensions`       |          | Free-form object passed through as `model.extensions` for custom data.                                 |

---

## Step 3 — the templates

Templates are **[Handlebars](https://handlebarsjs.com/)**. File names follow the framework's
convention (see the [template file map](#template-file-map) below). For our React + CSS `Pill`:

**`templates/react/css/Pill/Pill.tsx.hbs`**

```hbs
import React from 'react';
import styles from './Pill.module.css';

export interface PillProps {
  children?: React.ReactNode;
  className?: string;
}

export const Pill = ({ children, className }: PillProps) => (
  <span data-prefix="{{prefix}}" className={[styles.pill, className].filter(Boolean).join(' ')}>
    {children}
  </span>
);
```

**`templates/react/css/Pill/Pill.module.css.hbs`**

```hbs
.pill {
  display: inline-flex;
  align-items: center;
  border-radius: 9999px;
  padding: 2px 10px;
  background: var(--{{prefix}}-bg, var(--color-primary));
  color: #fff;
}
```

> Provide templates for **every** `framework × styleSystem` combination you listed in the
> component manifest. If a user generates with a combination you didn't supply, that file simply
> won't be produced.

---

## Step 4 — generate it

From your project root:

```bash
npx crucible list          # Pill now appears in the list
npx crucible add Pill      # generates src/components/Pill/Pill.tsx + Pill.module.css
```

That's it — the output lives in your project as plain, owned source, identical to a built-in.

---

## Template file map

The engine resolves these template file names per framework and style system. `<Name>` is the
component `id` (PascalCase); Angular lowercases it.

| Framework | Always                                                    | CSS adds                  | SCSS adds                  | Stories (`--stories`)        |
| --------- | --------------------------------------------------------- | ------------------------- | -------------------------- | ---------------------------- |
| React     | `<Name>.tsx.hbs`                                           | `<Name>.module.css.hbs`   | `<Name>.module.scss.hbs`   | `<Name>.stories.tsx.hbs`     |
| Vue       | `<Name>.vue.hbs`                                           | —                         | —                          | `<Name>.stories.ts.hbs`      |
| Angular   | `<name>.component.ts.hbs`, `<name>.component.html.hbs`     | `<name>.component.css.hbs`| `<name>.component.scss.hbs` | `<name>.stories.ts.hbs`      |

> Tailwind adds no extra style file — styles come from Tailwind classes in your markup (use
> `model.tailwindVariants` / `tailwindDefaults`). Stories templates are optional; they're only
> rendered when generation runs with `--stories`.

---

## Template variables (the model)

Each template is rendered with the component **model** as its context. The most useful fields:

| Variable                                       | Description                                              |
| ---------------------------------------------- | ------------------------------------------------------- |
| `{{name}}`                                     | Component id (PascalCase).                               |
| `{{prefix}}`                                   | Class/CSS prefix from the manifest.                     |
| `{{framework}}` · `{{isReact}}` `{{isVue}}` `{{isAngular}}` | Active framework + booleans.               |
| `{{styleSystem}}`                              | `css` \| `scss` \| `tailwind`.                          |
| `{{variants}}` `{{sizes}}` `{{states}}`        | Arrays from the manifest (use with `{{#each}}`).        |
| `{{hasVariant}}` `{{hasSize}}` `{{hasLoading}}` `{{hasDisabled}}` `{{hasError}}` `{{hasId}}` `{{hasLabel}}` `{{hasClassName}}` … | Feature booleans derived from manifest props/states. |
| `{{a11y.role}}` `{{a11y.focusTrap}}` `{{a11y.keyboardNav}}` | Accessibility flags.                        |
| `{{tailwindVariants}}`                         | The manifest's `tailwindDefaults` map.                  |
| `{{tokens}}`                                   | Resolved design tokens (CSS vars, JS, component tokens).|
| `{{vueUseId}}`                                 | Vue only — emit `useId()` (3.5+) vs the legacy fallback.|
| `{{extensions}}`                               | Your free-form manifest `extensions` object.            |

### Built-in Handlebars helpers

| Helper                          | Example                                       |
| ------------------------------- | --------------------------------------------- |
| `eq`                            | `{{#if (eq styleSystem "scss")}}…{{/if}}`     |
| `includes`                      | `{{#if (includes states "loading")}}…{{/if}}` |
| `capitalize` / `toLowerCase`    | `{{capitalize name}}` · `{{toLowerCase name}}`|
| `kebab`                         | `{{kebab name}}` → `dropdown-menu`            |
| `hbs`                           | `{{hbs "expr"}}` → emits a literal `{{expr}}` (useful when generating Vue/Angular template syntax) |

Plus all standard Handlebars built-ins (`{{#if}}`, `{{#each}}`, `{{#unless}}`, …).

---

## Compatibility & overrides

- **`engineVersion`** is a semver range checked against the installed Crucible. If incompatible,
  the plugin is skipped and Crucible prints:
  `⚠ Skipping plugin "<id>": incompatible engine version (needs <range>, engine is <version>)`.
- **Overrides:** if your component `id` matches a built-in (or another plugin), the
  later-loaded one wins, with a collision warning. Use this to customize a bundled component by
  shipping your own manifest + templates under the same id.

---

## Troubleshooting

| Symptom                                   | Likely cause / fix                                                                 |
| ----------------------------------------- | ---------------------------------------------------------------------------------- |
| Component missing from `crucible list`    | `plugin.json` not under `.crucible/plugins/<dir>/`, or its path isn't in `components`. Check JSON is valid. |
| Plugin silently skipped                   | `engineVersion` is higher than your installed Crucible — relax it or upgrade.       |
| A file isn't generated                    | No template exists for that `framework × styleSystem`, or the filename doesn't match the [file map](#template-file-map). |
| `{{prefix}}` etc. render literally         | Template wasn't treated as Handlebars — ensure the file ends in `.hbs`.            |
| Want to see what would be written         | Run `crucible add <Name> --dry-run --verbose`.                                      |

---

For the **internal architecture** — how the loader populates the registry, the proxy-backed
defaults, `engineVersion` gating, multi-root template resolution, and collision/override
semantics — see [ARCHITECTURE.md § 8.4 Plugin System](../ARCHITECTURE.md#84-plugin-system).
For real-world manifest examples, browse the bundled specs under
`src/registry/manifests/components/`.
