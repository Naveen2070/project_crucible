# ⚗ Crucible — v0.1 Completion & Production Roadmap

This file tracks the remaining tasks required to reach the full **v0.1 Definition of Done** as specified in the architecture guide, as well as the roadmap for **v1.0 Production Readiness**.

---

## 🔴 Missing for v0.1 (Current Focus)

These items are explicitly required by the `crucible-v01-guide.md` but are currently missing from the implementation.

### 1. Accessibility & Component Logic
- [ ] **Input Component: Password Toggle**
  - Implement internal state in `Input.tsx.hbs` to toggle visibility when `type="password"`.
  - Add a toggle button with `aria-label` for screen reader state (Show/Hide).
- [ ] **Select Component: Type-Ahead Navigation**
  - Update `Select.tsx.hbs` to listen for alphanumeric keys.
  - Implement logic to jump focus to options starting with the typed character.

### 2. DevOps & Documentation
- [ ] **CI/CD: Chromatic Integration**
  - Create `.github/workflows/chromatic.yml` as defined in Step 11.8 of the guide.
  - Ensure it triggers on push to verify visual regressions.
- [ ] **Root README.md**
  - Create a comprehensive `README.md` explaining the CLI, the "No-Wrapper" philosophy, and getting started instructions.

---

## 🚀 Production Readiness (v1.0 Roadmap)

Improvements to transition Crucible from a functional prototype to a robust developer tool.

### 1. Developer Experience (DX)
- [ ] **`crucible init` Command**
  - Create an interactive command to scaffold a default `crucible.config.json` file.
  - Include comments for all major configuration keys.
- [ ] **Interactive Component Picker**
  - Enhance `crucible add` (without arguments) to show an interactive multi-select prompt for components.
- [ ] **Barrel File Management**
  - Automatically manage an `index.ts` in the output directory to simplify imports (e.g., `import { Button } from '@/components'`).

### 2. Architecture & Advanced Features
- [ ] **Component Dependency Resolution**
  - Detect if a scaffolded component (e.g., `Select`) depends on another (e.g., `Button`) and offer to scaffold the dependency if missing.
- [ ] **Config Ejection**
  - Add a command to "eject" the built-in themes (`minimal`, `soft`) into the local config file for easier full-theme customization.
- [ ] **Pre-Generation Validation**
  - Add a "dry-run" or linting pass for the config file to catch token errors (e.g., circular references or missing color values) before writing files.

---

## ✅ Completed (Migration Phase)
- [x] Theme Presets (`minimal`, `soft`)
- [x] Dark Mode Auto-Derivation (OKLCH)
- [x] Tailwind CSS Support (Arbitrary value bridging)
- [x] Template Restructuring (`templates/react/css/` and `templates/react/tailwind/`)
- [x] Snapshot Testing Suite for both Style Systems
