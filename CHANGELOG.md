# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project
adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.3] - 2026-03-30

### Added

- **Manual dark mode strategy**: New `darkMode: { strategy: "manual" }` config option generates
  `.dark { }` CSS class instead of `@media (prefers-color-scheme: dark)`. This allows manual toggle
  control via JavaScript by adding/removing the `.dark` class on the `<html>` element.

### Fixed

- **Angular Dialog templates**: Renamed to lowercase for Linux compatibility
- **Vue SCSS templates**: Fixed Handlebars parse errors in Button, Input, Card, and Select
  components

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
