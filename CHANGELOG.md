# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Changed

- **Dependencies upgraded** across the CLI, dev tooling, and all playgrounds.
  - **CLI runtime:** `commander` 13 → **15**, `ansis` 3 → **4**, plus in-range bumps to
    `@inquirer/prompts`, `ajv`, and `prettier`.
  - **Node requirement raised to `>=22.12 <25`** (was `>=20 <25`). Commander 15 is ESM-only, and the
    CLI ships as CommonJS, so loading it via `require(esm)` needs Node **22.12+**.
  - **Dev tooling:** Vitest 3 → **4**, `concurrently` 9 → **10**, `eslint` 9 → **10**; declared the
    previously-transitive `glob` dependency; in-range bumps (`tsx`, `@types/*`, etc.).

- **Playgrounds rebuilt as standalone projects** (no longer npm workspaces). Each `playground/<fw>`
  is now scaffolded the recommended way — a fresh framework app (`npm create vite@latest` /
  `ng new`) plus official `npx storybook@latest init` — with its own `node_modules` and lockfile.
  - This **fixes the Angular Storybook build** (previously broken in the workspace because
    `storybook` core hoisted to the root while `@angular-devkit/build-angular` stayed nested).
  - Fresh scaffolds pull the latest toolchains: **Storybook 10.4.2**, **Vite 8**, **React 19**,
    **Vue 3.5**, and **Angular 22** — all three Storybooks build green. The Angular playground sets
    `legacy-peer-deps=true` (via `.npmrc`) because `@storybook/angular@10.4.2` peers an older devkit
    than Angular 22 ships — the resulting tree installs and builds correctly — and disables Compodoc
    on the Storybook targets (autodocs arg-tables, not needed and fragile to build).
  - The root `package.json` is de-coupled from the playgrounds: Storybook/browser-test deps
    (`@storybook/addon-vitest`, `@vitest/browser`, `@vitest/browser-playwright`, `playwright`) were
    removed and the root Storybook Vitest project dropped; `react`/`react-dom` are declared for the
    accessibility suite, which now dedupes React across the standalone playground.

- **Generated React/Vue type-only imports** now use the inline `type` modifier
  (`type Placement`, `type SortDirection`, `type VirtualState`) so generated components build under
  Vite 8's rolldown bundler (which, unlike esbuild, rejects importing a type as a value).

- **IDs no longer use `Math.random()`** in generated Vue and Angular components (CodeQL
  `js/insecure-randomness`). React already used `useId()`; Vue and Angular now match.
  - **Vue** — generated components use the native **`useId()`** composable (Vue **3.5+**) by
    default. The generator detects the consumer's installed Vue version at `crucible add` time;
    if an older Vue is found it emits a **deprecated fallback** (`getCurrentInstance()?.uid`) and
    prints a warning recommending an upgrade. Generated Vue code now targets **Vue 3.5+**.
  - **Angular** — generated components use a module-level incrementing counter
    (`let uid = 0; … ${++uid}`), the idiom used by Angular Material. No version requirement.
  - Deterministic, collision-free, and SSR-safe IDs; removes the recurring scanner finding.

### Security

- Eliminated cryptographically-weak `Math.random()` from all generated component ID generation
  (false-positive ARIA-id usage, but removed for correctness and to clear the CodeQL alert).

## [1.1.0] - 2026-06-06

> **App-Building Kit** — 14 new components bring the library to **25**, enough to scaffold a
> minimal SaaS app, web app, form, or marketing site. Suite: **448 unit tests / 48 files /
> 238 E2E phases / 453 templates**. All components ship across React/Vue/Angular ×
> CSS/SCSS/Tailwind, are token-backed, and include snapshot + E2E coverage.

### Added

- **Label** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Accessible form label with `htmlFor` association and a `required` marker (`aria-hidden` `*`)
  - Sizes: sm/md/lg · `disabled` styling
  - Monolithic (single `forwardRef`/component); custom theming via `--label-*` CSS vars
  - Zero peer deps
- **Separator** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Visual or semantic divider; `orientation="horizontal" | "vertical"`
  - `role="separator"` + `aria-orientation`, or `decorative` mode (`role="none"`, dropped from a11y tree)
  - Optional centered `label` (the "OR" divider pattern) on horizontal separators
  - Custom theming via `--separator-*` CSS vars (color/thickness/spacing/label)
  - Zero peer deps
- **Badge** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - 7 variants: default, primary, secondary, outline, success, warning, destructive · Sizes: sm/md/lg
  - Tailwind variant classes sourced from the manifest `tailwindDefaults` (single source of truth)
  - Custom theming via `--badge-*` CSS vars (radius/font/severity backgrounds)
  - Zero peer deps
- **Skeleton** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Loading placeholder; variants: default, text, circle, rect · custom `width`/`height`
  - `aria-busy="true"` + `aria-live="polite"`; pulse animation (CSS keyframes / `animate-pulse`)
  - Respects `prefers-reduced-motion`; custom theming via `--skeleton-*` CSS vars
  - Zero peer deps
- **Avatar** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Image with **initials fallback on load error** (`onError`/`@error`/`(error)`)
  - Variants: circle, square · Sizes: xs/sm/md/lg · `role="img"` + `aria-label`
  - Custom theming via `--avatar-*` CSS vars (radius/fallback bg+color/font-weight)
  - Zero peer deps
- **Textarea** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Multi-line field with built-in label/hint/error wiring; `rows`, `maxLength`
  - Variants: default, error · Sizes: sm/md/lg · `disabled`
  - `aria-invalid`/`aria-describedby`/`aria-required`; vertical resize; Vue `v-model`
  - Monolithic; custom theming via `--textarea-*` CSS vars; zero peer deps
- **Checkbox** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Native `<input type="checkbox">` with `indeterminate` set imperatively (React/Vue ref effect,
    Angular `[indeterminate]` property binding — never a JSX attribute)
  - Variants: default, error · Sizes: sm/md/lg · `disabled`/`checked`/`error` states
  - `onCheckedChange` / `v-model` / `checkedChange`; label + error wiring; `accent-color` styling
  - Custom theming via `--checkbox-*` CSS vars; zero peer deps
- **Switch** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - `role="switch"` toggle (button with track + thumb), `aria-checked`
  - Controlled (`checked`) + uncontrolled (`defaultChecked`); Sizes: sm/md/lg · `disabled`
  - Per-size thumb translate; respects `prefers-reduced-motion`; label associated via `for`
  - Custom theming via `--switch-*` CSS vars (track on/off, thumb, transition); zero peer deps
- **Alert** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Inline `role="alert"` message; variants: default, info, success, warning, destructive
  - Per-variant `color-mix` tinted background + icon; optional dismiss button (`onClose`/`@close`/`(close)`)
  - Title + description (children/slot/`ng-content`); custom theming via `--alert-*` CSS vars
  - Zero peer deps
- **Progress** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - `role="progressbar"` with `aria-valuemin`/`max`/`now`; **linear bar or circular SVG ring**
  - Determinate (`value`/`max`) or **indeterminate continuous loader** (animated bar / spinning ring)
  - Sizes: sm/md/lg; circular ring driven by stroke-dash math; respects `prefers-reduced-motion`
  - Custom theming via `--progress-*` CSS vars (track/bar/transition); zero peer deps
- **Breadcrumb** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - `<nav aria-label="Breadcrumb">` → `<ol>`, items-driven; `aria-current="page"` on the last crumb
  - Custom `separator`, `maxItems` collapse-to-ellipsis · Sizes: sm/md/lg
  - Monolithic items API across all frameworks (inline separator, no extra dependency)
  - Custom theming via `--breadcrumb-*` CSS vars; zero peer deps
- **RadioGroup** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - WAI-ARIA radiogroup: `role="radiogroup"`/`role="radio"`, `aria-checked`, roving tabindex
  - Always-automatic activation (arrow keys move focus **and** select); horizontal/vertical orientation
  - Compound API: Root/Item (React/Vue); Angular monolithic (`items` array)
  - Reuses the shared roving-tabindex kernel; custom theming via `--radio-*` CSS vars; zero peer deps
- **Accordion** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Collapsible disclosure; `type="single" | "multiple"` with `collapsible`
  - `<button aria-expanded aria-controls>` triggers in headings + `role="region"` panels
  - Vertical roving keyboard nav (ArrowUp/Down/Home/End); rotating chevron indicator
  - Variants: default, bordered, separated · Sizes: sm/md/lg
  - Compound API: Root/Item/Trigger/Content (React/Vue); Angular monolithic (`items` array)
  - Custom theming via `--accordion-*` CSS vars; zero peer deps
- **DropdownMenu** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - `@floating-ui`-positioned menu (`offset`/`flip`/`shift`); `role="menu"` + `role="menuitem"`
  - React: `useListNavigation` (roving) + `useTypeahead` + `FloatingList`/`FloatingFocusManager`;
    Vue/Angular implement roving + dismiss manually (those floating-ui hooks are React-only)
  - Trigger `aria-haspopup="menu"` (`asChild` to use a Button); `closeOnSelect`; Escape/click-outside close
  - Variants: default, minimal · Sizes: sm/md/lg · default placement `bottom-start`
  - Compound API: Root/Trigger/Content/Item/Separator/Label (React/Vue); Angular monolithic (`items`)
  - Depends on **Button**; peer deps `@floating-ui/react` · `@floating-ui/vue` · `@floating-ui/dom`
  - Custom theming via `--menu-*` CSS vars (background/border/shadow/item hover/z-index)

- **Tooltip** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Floating label positioned via `@floating-ui` (`offset`/`flip`/`shift`/`arrow`)
  - `role="tooltip"` with `aria-describedby` wiring on the trigger
  - Triggers: hover (default) + keyboard focus for a11y parity, or click
  - Compound API: Root/Trigger/Portal/Content/Arrow (React/Vue); Angular monolithic
  - Variants: default, minimal · Sizes: sm/md/lg · default placement `top`
  - No focus trap and no Close (lightweight Popover variant); Escape dismisses
  - Custom theming via `--tooltip-*` CSS vars (background/border/text/shadow/radius/z-index)
  - Zero peer deps (import `@floating-ui/*` as needed)
- **Tabs** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - WAI-ARIA tabs pattern: `role="tablist"`/`role="tab"`/`role="tabpanel"`, roving tabindex
  - 4-part compound API: Root/List/Trigger/Content (Object.assign on Root)
  - Schema-driven monolithic mode when compound off (`items={[{value,label,content,disabled?}]}`)
  - Controlled (`value`) + uncontrolled (`defaultValue`) state
  - `orientation="horizontal" | "vertical"` and `activationMode="manual" | "automatic"`
  - Variants: default, underline, pills · Sizes: sm/md/lg
  - Keyboard nav: Arrow keys (orientation-aware), Home/End, skip-disabled wrap-around
  - Always-mounted with `hidden` attr (preserves panel state); `forceMount` escape hatch
  - Custom highlight via `--tabs-*` CSS vars (active-indicator, active-bg, hover-bg, thickness)
  - Custom item rendering across all frameworks:
    - **React**: `label`/`content` typed as `ReactNode` in monolithic `items`; children-as-anything in compound
    - **Vue monolithic**: named slots `#trigger-{value}` / `#content-{value}` per tab, with `item` slot prop (string label remains the fallback)
    - **Angular**: `TabTemplateDirective` on `<ng-template>` (`appTabTemplate="value" appTabTemplateSlot="trigger|content"`) for per-tab template refs; falls back to `item.label`/`item.content`
  - Zero peer deps
- **Form** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Validation: `required`/`pattern`/`min`/`max`/`minLength`/`maxLength`/custom, modes:
    onSubmit/onBlur/onChange/onTouched/all
  - Optional react-hook-form adapter
  - 8-part compound API: Root/Field/Item/Label/Control/Description/Message/Submit
  - Schema-driven mode when compound off
  - ARIA-wired (`aria-describedby`/`aria-invalid`/`aria-required`), `asChild`, `role="alert"` on
    Message
  - Zero peer deps
- **Toast** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Global `toast()` with `success`/`error`/`warning`/`info`/`loading`/`promise`
  - `<Toaster>` props:
    `position`/`duration`/`maxToasts`/`richColors`/`closeButton`/`pauseWhenPageIsHidden`/per-toast
    `action`
  - Inline keyframe animations, `aria-live`/`role="status"`
  - Zero peer deps
- **Popover** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Placement (top/bottom/left/right), alignment (start/center/end), variant (default/minimal), size
    (sm/md/lg)
  - Trigger (click/hover), modal, arrow, `@floating-ui`-powered
  - Focus trap, focus restore, full ARIA wiring
- **Table** (React/Vue/Angular × CSS/SCSS/Tailwind)
  - Client/server pagination, sortable headers, single/multi selection
  - Virtualization (5000+ rows), loading state, optional `caption`
  - React compound API: Header/Body/Pagination

### Fixed

- **Popover (Vue)**: open-flicker — use `top`/`left` instead of `transform`; CSS-driven entry after
  `isPositioned`
- **Popover (React)**: `Close asChild` — `cloneElement` instead of nested `<button>`
- **Table sort (all)**: remove `&& onSort` guard — sort works without parent callback
- **Table compound (React)**: orphan `<thead>`/`<tbody>` → wrap in real `<table>` for correct column
  sizing
- **Table virtualization (React)**: add missing `containerHeight` destructure
- **Table playgrounds (Vue/Angular)**: stripped mustaches → `v-text`/`[innerText]`
- **Popover stories (all)**: `variant="minimal"` → `"ghost"`; Angular uses `<app-button>`
- **CLI version**: `crucible --version` now reports the real package version instead of a hardcoded
  `1.0.0`
- **Plugin engine compatibility**: corrected the engine-version lookup path in the plugin loader
  (`../../package.json`) so `engineVersion` semver gating compares against the true engine version —
  previously it silently defaulted to `1.0.0`, which would wrongly reject plugins requiring `>=1.1.0`

### Accessibility

- **Table**: `scope="col"`, optional `<caption>`, `aria-busy` when loading, reduced-motion
- **Popover**: focus move/open → restore/close, `tabindex="-1"`, `aria-modal` only when modal,
  reduced-motion

## [1.0.4] - 2026-03-31

### Changed

- **Replace `chalk` with `ansis`**: Updated terminal styling library from chalk to ansis for better
  performance and modern API
- **Replace `fs-extra` with native `node:fs`**: Removed fs-extra dependency in favor of native
  Node.js fs modules for better performance and zero runtime dependencies
- **Shared fs utility module**: Created `src/utils/fs.ts` with reusable helpers (`pathExists`,
  `readJson`, `writeJson`, `ensureDir`, `remove`)

### Dependencies

- **Removed**: `chalk`, `fs-extra`, `@types/fs-extra`
- **Added**: `ansis`

### Testing

- Added `test:bun` script for running tests with bun via `bunx vitest`

### Fixed

- **tsconfig.json**: Updated rootDir and include paths to correctly compile CLI and scripts

## [1.0.3] - 2026-03-30

### Added

- **Manual dark mode strategy**: New `darkMode: { strategy: "manual" }` config option generates
  `.dark { }` CSS class instead of `@media (prefers-color-scheme: dark)`. This allows manual toggle
  control via JavaScript by adding/removing the `.dark` class on the `<html>` element.

### Fixed

- **Vue SCSS templates**: Fixed Handlebars parse errors in Button, Input, Card, and Select
  components

## [1.0.2] - 2026-03-30

### Fixed

- **Angular Dialog templates**: Renamed to lowercase for Linux compatibility

### Testing

- Add verbose flag and error handling for E2E tests
- Add debug output to Angular Dialog E2E test
- Show CLI output in E2E

### CI/CD

- Add workflow file for tests
- Debug test failures
- Clean up workflow to standard format

## [1.0.1] - 2026-03-29

### Added

- **Official Documentation Site**: https://crucible-docs.naveenr.in
- **Docs field in package.json**: Points to documentation site
- **README updates**: Documentation link added

## [1.0.0] - 2026-03-27

### Added

> **v1.0.0 is the first stable release of Crucible — a code generation engine that generates style
> system/spec-based components.**

- **230 Unit Tests**: Comprehensive test coverage across 24 test files
- **19 E2E Phases**: Full CLI automation testing
- **Multi-Framework Support**: React, Vue 3, and Angular with full feature parity
- **Three Style Systems**: CSS Modules, SCSS Modules, Tailwind CSS v4
- **Theme Presets**: Minimal (neutral) and Soft (rounded, pastel tints) with deep merge
- **Automatic Dark Mode**: OKLCH-based perceptually uniform color derivation
- **Compound Components**: React static property pattern, Vue named slots, Angular content
  projection
- **Interactive CLI**: @inquirer/prompts with guided setup and shorthand commands
- **Hash-Based Protection**: User edit detection before overwriting
- **Component Registry**: Path generator with ComponentMeta defaults
- **Template Audit**: Logic enforcement script (`npm run audit:templates`)
- **Prettier Integration**: Auto-formatting all generated code
- **Dependency Resolution**: Auto-scaffold Button for Select/Dialog components
- **Semantic Color Tokens**: Foreground variants for all colors (primary, secondary, destructive)
- **CLI Command Shorthands**: i, d, t, e, a, l, pg, po, pd, c, pcl, cfg
- **CLI New Flags**: `-s/--style`, `-t/--theme`, `-a/--all` for `add` command
- **CLI New Commands**: `clean`, `pg:clean`, `config`
- **Tailwind Auto-Setup**: Auto-detect and configure Tailwind CSS v4
- **Global Tokens**: tokens.css emission to public/**generated**/
- **Playground System**: Dev environments for all three frameworks

### Changed

- **Button Variants**: Added `default`, `outline`, `ghost`, `link`, `destructive` variants (standard
  pattern)
- **Button Sizes**: Added `xs` and `icon` sizes
- **Card Components**: Added `CardDescription` and `CardAction` sub-components
- **Focus Ring**: Standardized to `ring-2 ring-ring ring-offset-2` pattern
- **Modal → Dialog**: Component renamed to Dialog across all templates
- **DialogIn Animation**: Renamed to `dialog-open` for consistency
- **Angular 17+ Control Flow**: All Angular templates use `@if`/`@for` instead of `*ngIf`/`*ngFor`
- **Angular Slot Naming**: Consistent `{component}-{slotname}` convention across all components
- **Error Variant Support**: Added `variant === 'error'` support for Input and Select across all
  frameworks
- **Vue Stories**: Updated to use explicit prop binding (`:variant`, `:size`) for slot compatibility

### Fixed

- **Story Template Bugs**: Fixed duplicate Default export in Button stories, import placement in
  Dialog stories
- **Button Variant Test**: Updated to expect `destructive` instead of `danger`
- **Dialog Accessibility**: Added aria-labelledby and aria-describedby to Angular Dialog

## [1.0.0-rc1] - 2026-03-23

### Added

- **CLI Commands**: `tokens` command for regenerating global CSS variables
- **Manifest System**: Upgraded hash protection to track config and engine version
- **ComponentMeta**: Extended defaults schema with `ComponentMeta` interface for
  single-source-of-truth component configuration
- **Dynamic README Generation**: Automatic README generation for components
- **Template Audit**: Script to enforce logic-free templates (`npm run audit:templates`)
- **Accessibility Tests**: axe integration and interaction tests for React components
- **Theme Permutations**: Snapshot tests for all theme and style system combinations
- **Dark Mode A11y**: axe verification for dark mode rendering
- **Writer UX**: Improved hash mismatch warning message
- **Modular CLI**: Extracted command logic into modular files
- **Repository Documentation**: ARCHITECTURE.md, CONTRIBUTING.md, ROADMAP.md, CODE_OF_CONDUCT.md

### Changed

- **Core Refactoring**: Framework partials and global partials extraction
- **React Templates**: Refactored to use shared partials
- **Angular/Vue Templates**: Refactored to use framework-specific partials
- **Shared Component CSS**: Extracted across all frameworks
- **Framework-Aware Partial Caching**: With watch-mode invalidation
- **Component Enhancements**: Professional component library-quality improvements
- **Modal → Dialog Rename**: Consistent naming across all templates

### Fixed

- **Story Template Bugs**: Fixed duplicate Default export in Button stories, import placement in
  Dialog stories
- **Button Variant Naming**: `danger` → `destructive` for standard naming
- **DialogDescription Support**: Added to Vue and Angular templates with aria-describedby

## [0.9.0] - 2026-03-21

### Added

- **Multi-Framework Playground**: Storybook support for all three frameworks
- **Component Dependency Resolution**: Automatic dependency checking and resolution
- **Global CSS Tokens File**: `tokens.css` generation for Vue and Angular
- **Tokens Import**: Smart import of `tokens.css` into index.html
- **Playground Scripts**: Easy generation and opening commands

### Fixed

- Storybook integration fixes for Angular and Vue
- Select size prop
- Tokens.css path in index.html
- Angular component generation issues
- Vue select selection/hover logic

## [0.8.0] - 2026-03-18

### Added

- **Handlebars Partials Support**: Reusable template components
- **Template Caching**: Optimized template compilation
- **Shared Partials**: Focus ring, dark mode, variant types

### Changed

- Registry simplified with path generator
- Framework-aware partial caching with watch-mode invalidation

## [0.7.0] - 2026-03-15

### Added

- **Path Traversal Protection**: Security hardening
- **Config Path Constraints**: Restricted config file access

### Changed

- Core domains extracted to enums
- CLI flags refactored (cwd, verbose, quiet)

## [0.6.0] - 2026-03-12

### Added

- **Doctor Command**: `crucible doctor` for setup validation

### Changed

- **Template Caching**: Handlebars compiled templates cached
- **Prettier Config Caching**: Config resolved once per run
- **Parallelized File I/O**: Promise.all for batch operations

## [0.5.0] - 2026-03-09

### Added

- **Init Command**: `crucible init` with interactive prompts
- **Interactive Add**: Multi-select component selection
- **Tailwind Auto-Setup**: Automatic Tailwind CSS v4 integration
- **Eject Command**: `crucible eject` to copy preset to config
- **Stories Flag**: Opt-in Storybook story generation

### Changed

- CLI dependency check made framework-aware
- Framework parity for Select navigation

## [0.4.0] - 2026-03-05

### Added

- **SCSS Style System**: `.module.scss` templates with nested BEM
- **SCSS Template Fallback**: Reuses CSS templates where possible

### Changed

- Angular `styleUrls` made dynamic for SCSS support
- Removed redundant Angular/Vue/React templates using engine fallback

## [0.3.0] - 2026-03-01

### Added

- **Angular Support**: Idiomatic Angular templates with standalone components
- **Vue Support**: Script setup and named slots
- **Framework Parity**: Equal feature support across all frameworks

### Changed

- Angular templates rewritten in idiomatic style
- Vue migrated to script setup with named slots
- Select navigation parity across frameworks

## [0.2.0] - 2026-02-25

### Added

- **Compound Component Pattern**: React static property pattern
- **Stories Opt-In**: `generateStories` flag in config
- **Output Restructuring**: Component subfolder organization

### Changed

- Template files reorganized on disk
- Opt-in stories logic implemented
- React templates updated with sub-component support

## [0.1.0] - 2026-02-22

### Added

- **Dark Mode**: OKLCH-based automatic dark mode derivation
- **Tailwind Support**: Full Tailwind CSS integration
- **Input Component**: With password toggle
- **Select Component**: Type-ahead functionality
- **E2E Tests**: Comprehensive integration test suite
- **Phase 1 Tasks**: CLI init, interactive add, Tailwind setup, eject

### Changed

- Migration to v0.1 architecture

## [0.0.6] - 2026-02-18

### Added

- **Playground Setup**: Development environment for all frameworks
- **Storybook Integration**: For component preview and testing

## [0.0.5] - 2026-02-14

### Added

- **Select Component**: Dropdown with keyboard navigation and combobox pattern

## [0.0.4] - 2026-02-10

### Added

- **Dialog Component**: Dialog with focus trap and confirm variant

## [0.0.3] - 2026-02-07

### Added

- **Card Component**: Container with hover/clickable variants

## [0.0.2] - 2026-02-03

### Added

- **Input Component**: Text input with validation states

## [0.0.1] - 2026-02-01

### Added

- **Project Setup**: Initial engine core
- **Testing Infrastructure**: Vitest setup
- **Button Component**: Multi-variant button with loading state
- **Architecture Documentation**: Initial system design
