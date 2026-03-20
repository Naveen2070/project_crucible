# ⚗ Crucible — v0.1 Completion & Production Roadmap

This file tracks the remaining tasks required to reach the full **v0.1 Definition of Done** as
specified in the architecture guide, as well as the roadmap for **v1.0 Production Readiness**.

---

## 🔴 Missing for v0.1 (Current Focus)

These items are explicitly required by the `crucible-v01-guide.md` but are currently missing from
the implementation.

### 1. Accessibility & Component Logic

- [ ] **Input Component: Password Toggle**
  - Implement internal state in `Input.tsx.hbs` to toggle visibility when `type="password"`.
  - Add a toggle button with `aria-label` for screen reader state (Show/Hide).
- [ ] **Select Component: Type-Ahead Navigation**
  - Update `Select.tsx.hbs` to listen for alphanumeric keys.
  - Implement logic to jump focus to options starting with the typed character.

### 2. DevOps & Documentation

- [x] **CI/CD: Chromatic Integration** (omitted for now)
  - Create `.github/workflows/chromatic.yml` as defined in Step 11.8 of the guide.
  - Ensure it triggers on push to verify visual regressions.
- [ ] **Root README.md**
  - Create a comprehensive `README.md` explaining the CLI, the "No-Wrapper" philosophy, and getting
    started instructions.

---

## 🚀 Production Readiness (v1.0 Roadmap)

Improvements to transition Crucible from a functional prototype to a robust developer tool.

### 1. Developer Experience (DX)

- [ ] **`crucible init` Command**
  - Create an interactive command to scaffold a default `crucible.config.json` file.
  - Include comments for all major configuration keys.
- [ ] **Interactive Component Picker**
  - Enhance `crucible add` (without arguments) to show an interactive multi-select prompt for
    components.
- [x] **Barrel File Management**(it might cause some issues while bundling and tree shaking so it is
      omitted for now)
  - Automatically manage an `index.ts` in the output directory to simplify imports (e.g.,
    `import { Button } from '@/components'`).

### 2. Architecture & Advanced Features

- [ ] **Component Dependency Resolution**
  - Detect if a scaffolded component (e.g., `Select`) depends on another (e.g., `Button`) and offer
    to scaffold the dependency if missing.
- [ ] **Config Ejection**
  - Add a command to "eject" the built-in themes (`minimal`, `soft`) into the local config file for
    easier full-theme customization.
- [ ] **Pre-Generation Validation**
  - Add a "dry-run" or linting pass for the config file to catch token errors (e.g., circular
    references or missing color values) before writing files.

---

## ✅ Completed (Migration Phase)

- [x] Theme Presets (`minimal`, `soft`)
- [x] Dark Mode Auto-Derivation (OKLCH)
- [x] Tailwind CSS Support (Arbitrary value bridging)
- [x] Template Restructuring (`templates/react/css/` and `templates/react/tailwind/`)
- [x] Snapshot Testing Suite for both Style Systems

---

# v0.1 Completion & DX Improvements Plan

## Background & Motivation
The project requires completing the final tasks outlined in `v01-remaining-tasks.md` to reach the v0.1 Definition of Done, alongside initiating v1.0 DX features. Specifically, we need to finalize the `Input` and `Select` components, build out the `init` command to scaffold a default config, add interactive prompts for missing arguments, and introduce a smart Tailwind v4 auto-setup workflow.

## Scope & Impact
This plan touches the following areas:
- **CLI Commands:** Refactoring `src/cli/index.ts` to support interactive prompts and expanding the `init` and `add` commands.
- **New DX Modules:** Introducing `src/cli/init.ts`, `src/cli/tailwind.ts`, and component dependency resolution logic.
- **Templates:** Enhancing `templates/react/*/Input.tsx.hbs` and `templates/react/*/Select.tsx.hbs`.
- **Dependencies:** Adding `@inquirer/prompts` to handle interactive user flows.

## Proposed Solution

### Phase 1: Interactive Prompts & Component Fixes
- [ ] 1. **Install `@inquirer/prompts`** as a standard dependency.
- [ ] 2. **Input Password Toggle:** Add internal state and an `aria-label` toggle button to `Input.tsx.hbs` when `type="password"`.
- [ ] 3. **Select Type-Ahead:** Implement alphanumeric key-down listeners in `Select.tsx.hbs` to focus options starting with the typed character.
- [ ] 4. **Root README:** Create a comprehensive `README.md` outlining the CLI usage and the "No-Wrapper" philosophy.

### Phase 2: Core DX Improvements
- [ ] 1. **`crucible init`:** Scaffold a default `crucible.config.json` pre-populated with minimal theme tokens and comments, so the user has an immediate working setup.
- [ ] 2. **Interactive Component Picker:** When running `crucible add` without arguments, display a multi-select prompt listing available components.
- [ ] 3. **Component Dependencies:** Before scaffolding, check if the component depends on another (e.g., `Select` depends on `Button`). If the dependency is missing in the output directory, prompt the user to scaffold it.
- [ ] 4. **Pre-Generation Validation & Config Ejection:** Add a command to eject built-in themes into the local config. Add a linting pass to catch token errors before file generation.

### Phase 3: Tailwind v4 Auto-Setup
- [ ] 1. **Detection:** When running `add` with a `tailwind` config, check the user's `package.json` for `tailwindcss` and scan common CSS paths (`src/index.css`, `src/App.css`, `app/globals.css`, etc.) for `@import "tailwindcss";` or `@tailwind base;`.
- [ ] 2. **Warning & Prompt:** If missing, halt the process with a warning and ask via `@inquirer/prompts` if they want to stop or proceed with auto-setup.
- [ ] 3. **Framework-Aware Setup:** If the user agrees, inspect the workspace (e.g., check for Vite or Next.js), install the appropriate Tailwind v4 package (`@tailwindcss/vite` or `@tailwindcss/postcss`), inject the `@import "tailwindcss";` into their main CSS file, and update `vite.config.ts` or `next.config.mjs` if feasible, otherwise output instructions.

## Alternatives Considered
- **Tailwind Setup:** We considered a generic setup (installing standalone CLI and outputting an `index.css`), but opted for the framework-aware approach to integrate cleanly into modern bundlers (like Vite) using Tailwind v4's new plugin architecture.
- **Prompt Libraries:** We evaluated `prompts` vs `@inquirer/prompts`, selecting `@inquirer/prompts` for its modern API and robustness.

## Execution & Stability Workflow
- [x] 1. **Sync Documentation:** As the very first step, append this entire plan/flow into `v01-remaining-tasks.md` so it can be referenced later.
- [ ] 2. **Phase Execution:** Execute the tasks in phases (Phase 1 to Phase 3).
- [ ] 3. **Stability Check:** After each stage of a feature implementation, bug fix, or error fix, run tests (`npm run test`, `npm run build`, and `npm run lint` if applicable) to ensure the entire project is completely stable.
- [ ] 4. **Commit:** Only commit the changes once the stability check passes for that stage. Never commit broken code.

## Verification & Testing
- Run `npm run generate:dev` and manually test the `Input` toggle and `Select` type-ahead in the Storybook environment.
- Run `crucible init` in a fresh directory to verify the default config generation.
- Test `crucible add` in a Vite project without Tailwind to trigger the auto-setup workflow and ensure the CSS injection and installation succeed.
- Confirm all checked-off tasks in `v01-remaining-tasks.md` are marked complete.
