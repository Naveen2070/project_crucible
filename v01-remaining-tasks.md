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
- [x] **Barrel File Management** (omitted for now — may cause bundling/tree-shaking issues)
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

The project requires completing the final tasks outlined in `v01-remaining-tasks.md` to reach the
v0.1 Definition of Done, alongside initiating v1.0 DX features. Specifically, we need to finalize
the `Input` and `Select` components, build out the `init` command to scaffold a default config, add
interactive prompts for missing arguments, and introduce a smart Tailwind v4 auto-setup workflow.

## Scope & Impact

This plan touches the following areas:

- **CLI Commands:** Refactoring `src/cli/index.ts` to support interactive prompts and expanding the
  `init` and `add` commands.
- **New DX Modules:** Introducing `src/cli/init.ts`, `src/cli/tailwind.ts`, and component dependency
  resolution logic.
- **Templates:** Enhancing `templates/react/*/Input.tsx.hbs` and `templates/react/*/Select.tsx.hbs`.
- **Dependencies:** Adding `@inquirer/prompts` to handle interactive user flows.

## Proposed Solution

### Phase 1: Interactive Prompts & Component Fixes

- [x] 1. **Install `@inquirer/prompts`** as a standard dependency.
- [x] 2. **Input Password Toggle:** Add internal state and an `aria-label` toggle button to
     `Input.tsx.hbs` when `type="password"`.
- [x] 3. **Select Type-Ahead:** Implement alphanumeric key-down listeners in `Select.tsx.hbs` to
     focus options starting with the typed character.
- [x] 4. **Root README:** Create a comprehensive `README.md` outlining the CLI usage and the
     "No-Wrapper" philosophy.

### Phase 2: Core DX Improvements

- [x] 1. **`crucible init`:** Scaffold a default `crucible.config.json` pre-populated with minimal
     theme tokens and comments, so the user has an immediate working setup.
- [x] 2. **Interactive Component Picker:** When running `crucible add` without arguments, display a
     multi-select prompt listing available components.
- [x] 3. **Component Dependencies:** Before scaffolding, check if the component depends on another
     (e.g., `Select` depends on `Button`). If the dependency is missing in the output directory,
     prompt the user to scaffold it.
- [x] 4. **Pre-Generation Validation & Config Ejection:** Add a command to eject built-in themes
     into the local config. Add a linting pass to catch token errors before file generation.

### Phase 3: Tailwind v4 Auto-Setup

- [x] 1. **Detection:** When running `add` with a `tailwind` config, check the user's `package.json`
     for `tailwindcss` and scan common CSS paths (`src/index.css`, `src/App.css`, `app/globals.css`,
     etc.) for `@import "tailwindcss";` or `@tailwind base;`.
- [x] 2. **Warning & Prompt:** If missing, halt the process with a warning and ask via
     `@inquirer/prompts` if they want to stop or proceed with auto-setup.
- [x] 3. **Framework-Aware Setup:** If the user agrees, inspect the workspace (e.g., check for Vite
     or Next.js), install the appropriate Tailwind v4 package (`@tailwindcss/vite` or
     `@tailwindcss/postcss`), inject the `@import "tailwindcss";` into their main CSS file, and
     update `vite.config.ts` or `next.config.mjs` if feasible, otherwise output instructions.

## Alternatives Considered

- **Tailwind Setup:** We considered a generic setup (installing standalone CLI and outputting an
  `index.css`), but opted for the framework-aware approach to integrate cleanly into modern bundlers
  (like Vite) using Tailwind v4's new plugin architecture.
- **Prompt Libraries:** We evaluated `prompts` vs `@inquirer/prompts`, selecting `@inquirer/prompts`
  for its modern API and robustness.

## Execution & Stability Workflow

- [x] 1. **Sync Documentation:** As the very first step, append this entire plan/flow into
     `v01-remaining-tasks.md` so it can be referenced later.
- [ ] 2. **Phase Execution:** Execute the tasks in phases (Phase 1 to Phase 3).
- [ ] 3. **Stability Check:** After each stage of a feature implementation, bug fix, or error fix,
     run tests (`npm run test`, `npm run build`, and `npm run lint` if applicable) to ensure the
     entire project is completely stable.
- [ ] 4. **Commit:** Only commit the changes once the stability check passes for that stage. Never
     commit broken code.

## Verification & Testing

- Run `npm run generate:dev` and manually test the `Input` toggle and `Select` type-ahead in the
  Storybook environment.
- Run `crucible init` in a fresh directory to verify the default config generation.
- Test `crucible add` in a Vite project without Tailwind to trigger the auto-setup workflow and
  ensure the CSS injection and installation succeed.
- Confirm all checked-off tasks in `v01-remaining-tasks.md` are marked complete.

---

### Phase 4: Comprehensive E2E Testing

#### Objective

To implement a "prod-like" comprehensive End-to-End (E2E) test suite for the Crucible CLI that
covers the `init` command, the `tailwind` setup flow, component scaffolding, and configuration
ejection without missing any edge cases.

#### Proposed Solution

**1. Add Automation Support (`--yes` flag)**

To effectively test an interactive CLI in an automated environment (and to improve the tool for
users in CI/CD), we need to add a `-y, --yes` flag to bypass prompts:

- **`crucible init -y`**: Automatically accepts defaults and creates `crucible.config.json`.
- **`crucible add <comp> -y`**: Automatically accepts missing dependencies and auto-agrees to the
  Tailwind setup flow.

**2. Comprehensive E2E Script (`scripts/e2e.ts`)**

We will create an E2E test script that programmatically executes the following phases in a temporary
dummy project (`.e2e-test-env`):

- **Phase A: Setup & Init**: Mock a clean `package.json` with React dependencies. Run
  `crucible init -y`.
- **Phase B: Eject Command**: Run `crucible eject` to test theme extraction.
- **Phase C: Tailwind Auto-Setup Flow**: Modify local config to `tailwind`. Run
  `crucible add Button -y` to trigger Tailwind auto-setup.
- **Phase D: Full Component Scaffolding**: Run `crucible add Select -y` and
  `crucible add Input Card Modal -y`.
- **Phase E: Compilation & Stability Check**: Run `npm install` and `tsc --noEmit`.
- **Phase F: Mandatory Cleanup**: Utilize a `try...finally` block to ensure `.e2e-test-env` is
  always completely removed.

#### Execution Status

- [x] 1. Update CLI (`index.ts`, `init.ts`, `tailwind.ts`) with `-y, --yes` flags.
- [x] 2. Create `scripts/e2e.ts` with full `try...finally` cleanup.
- [x] 3. Update `package.json` to include `"test:e2e": "tsx scripts/e2e.ts"`.
- [x] 4. Run `npm run test:e2e` to verify stability and commit.

---

### Phase 5: Component Folder Grouping, Template Restructuring & Opt-In Stories

#### Objective

Improve the organisation of both the template source files inside the Crucible engine and the
generated output files in the user's project. Introduce opt-in Storybook story generation so that
projects not using Storybook are never given files they don't need.

#### Background & Motivation

With 5 components × 3 files × 2 style systems, the flat template folders were becoming hard to
navigate (30 files, no grouping). Similarly, generated output landing flat in `__generated__/` made
it hard to find related files, and deleting a component meant hunting for 3 separate files. Stories
should also not be generated by default — not every project uses Storybook and they should be
explicitly opted into.

#### Scope & Impact

This phase touches exactly six areas of the codebase:

| File                      | Change                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------- |
| `src/config/reader.ts`    | Add `flags.stories?: boolean` to `CrucibleConfig`                                  |
| `src/components/model.ts` | Add `generateStories: boolean` to `ComponentModel` + builder param                 |
| `src/templates/engine.ts` | Skip story target when `generateStories` is false · resolve `model.name` subfolder |
| `src/scaffold/writer.ts`  | Write into `<outputDir>/<ComponentName>/` subfolder · update hash keys             |
| `src/cli/index.ts`        | Add `--stories` / `--no-stories` flags · three-way resolution logic                |
| `.storybook/main.ts`      | Verify glob already covers subfolders (no change needed)                           |

Template files on disk are reorganised but their content is unchanged.

#### Proposed Solution

**1. Template folder restructuring**

Move all `.hbs` files from flat folders into per-component subfolders. Content of every file stays
identical — this is a filesystem reorganisation only.

```
Before                              After
──────────────────────────────────  ──────────────────────────────────────────
templates/react/css/                templates/react/css/
  Button.tsx.hbs                      Button/
  Button.module.css.hbs                 Button.tsx.hbs
  Button.stories.tsx.hbs               Button.module.css.hbs
  Input.tsx.hbs                         Button.stories.tsx.hbs
  Input.module.css.hbs                Input/
  Input.stories.tsx.hbs                 Input.tsx.hbs
  ...                                   Input.module.css.hbs
                                        Input.stories.tsx.hbs
templates/react/tailwind/             ...
  Button.tsx.hbs                  templates/react/tailwind/
  Button.stories.tsx.hbs            Button/
  Input.tsx.hbs                       Button.tsx.hbs
  Input.stories.tsx.hbs               Button.stories.tsx.hbs
  ...                               Input/
                                      Input.tsx.hbs
                                      Input.stories.tsx.hbs
                                    ...
```

**2. Generated output folder restructuring**

Each component gets its own named subfolder in the output directory.

```
Before                              After
──────────────────────────────────  ──────────────────────────────────
src/components/                     src/components/
  Button.tsx                          Button/
  Button.module.css                     Button.tsx
  Button.stories.tsx                    Button.module.css
  Input.tsx                             Button.stories.tsx   ← only if opted in
  Input.module.css                    Input/
  Input.stories.tsx                     Input.tsx
                                        Input.module.css
```

**3. Opt-in stories — config default + CLI flag override**

Stories are never generated unless explicitly requested. Resolution priority is CLI flag → config
default → false.

Config (`crucible.config.json`):

```json
{
  "flags": {
    "outputDir": "src/components",
    "stories": true
  }
}
```

CLI usage:

```bash
crucible add Button              # uses config default
crucible add Button --stories    # force stories on for this command
crucible add Button --no-stories # force stories off for this command
```

**4. Code changes — exact diffs**

`src/config/reader.ts` — add `stories` to flags:

```typescript
flags?: {
  outputDir?: string;
  stories?:   boolean;   // opt-in story generation — false when absent
};
```

`src/components/model.ts` — add field and builder param:

```typescript
export interface ComponentModel {
  // ... existing fields
  generateStories: boolean;
}

export function buildComponentModel(
  name: string,
  tokens: ResolvedTokens,
  config: CrucibleConfig,
  generateStories: boolean, // resolved by CLI before calling
): ComponentModel {
  return { ...existing, generateStories };
}
```

`src/templates/engine.ts` — subfolder path + conditional story target:

```typescript
// One-line change: add model.name to the path
const tplDir = path.join(
  process.cwd(),
  'templates',
  model.framework,
  model.styleSystem,
  model.name,
);

// Conditional story target
const storyTarget = { tpl: `${model.name}.stories.tsx.hbs`, out: `${model.name}.stories.tsx` };
const targets = model.generateStories ? [...coreTargets, storyTarget] : coreTargets;
```

`src/scaffold/writer.ts` — write to named subfolder:

```typescript
// outDir becomes <outputDir>/<ComponentName>/
const componentDir = path.join(outputDir, componentName);
await fs.ensureDir(componentDir);

// Hash keys become "Button/Button.tsx" — no cross-component collisions
hashes[`${componentName}/${filename}`] = newHash;

// Log output shows full relative path
console.log(chalk.green(`✓  ${componentName}/${filename}`));
```

`src/cli/index.ts` — three-way stories resolution:

```typescript
program
  .command('add <component>')
  .option('--stories', 'Generate Storybook story file')
  .option('--no-stories', 'Skip story generation (overrides config default)')
  // ...
  .action(async (componentName, opts) => {
    const config = await readConfig(opts.config);

    // opts.stories = true  → --stories passed
    // opts.stories = false → --no-stories passed
    // opts.stories = undefined → neither flag, fall through to config
    const generateStories =
      opts.stories !== undefined ? opts.stories : (config.flags?.stories ?? false);

    const model = buildComponentModel(componentName, tokens, config, generateStories);
    await writeFiles(files, outDir, componentName, { force: opts.force });

    const storiesNote = generateStories ? ' + story' : '';
    console.log(
      chalk.cyan(
        `\n⚗  ${componentName}/ [${config.styleSystem}/${config.theme}${storiesNote}] → ${outDir}`,
      ),
    );
  });
```

**5. `.crucible-hashes.json` format change**

Hash keys now include the component subfolder to prevent cross-component filename collisions:

```json
{
  "Button/Button.tsx": "a3f2c8e1b994",
  "Button/Button.module.css": "d7e1a2b3c4f5",
  "Input/Input.tsx": "b2e3d4c5a6f7",
  "Input/Input.module.css": "c3f4e5d6b7a8"
}
```

**6. Storybook glob — no change required**

The existing glob `../src/__generated__/**/*.stories.tsx` already matches files at any subfolder
depth. Verified — no change to `.storybook/main.ts` needed.

**7. Repo setup command update**

```bash
# Updated mkdir to create component subfolders directly
mkdir -p templates/react/css/{Button,Input,Card,Modal,Select}
mkdir -p templates/react/tailwind/{Button,Input,Card,Modal,Select}
```

#### Execution Status

- [x] 1. **Reorganise template files on disk** — move all `.hbs` files into per-component
     subfolders. No content changes.
- [x] 2. **Update `src/config/reader.ts`** — add `flags.stories?: boolean`.
- [x] 3. **Update `src/components/model.ts`** — add `generateStories` field and builder param.
- [x] 4. **Update `src/templates/engine.ts`** — add `model.name` to `tplDir` + conditional story
     target list.
- [x] 5. **Update `src/scaffold/writer.ts`** — write to `componentDir` subfolder + update hash key
     format.
- [x] 6. **Update `src/cli/index.ts`** — add `--stories` / `--no-stories` flags + three-way
     resolution + pass `componentName` to `writeFiles`.
- [x] 7. **Update snapshot tests** — run `vitest --update-snapshots` to commit new baselines
     reflecting subfolder paths in output.
- [x] 8. **Update E2E script** — add test cases for `--stories`, `--no-stories`, and config default
     in `scripts/e2e.ts`. Verify subfolder structure in Phase D assertions.
- [x] 9. **Update `crucible-architecture.md`** and `crucible-v01-guide.md` — reflect new folder
     structure diagrams, updated `mkdir` commands, and stories flag documentation.
- [x] 10. **Stability check** — run `npm run test`, `npm run build`, `npm run test:e2e`. All must
      pass before commit.
- [x] 11. **Commit** with message:
      `feat: component folder grouping + template restructure + opt-in stories (#phase5)`

#### Verification & Testing

- Run `crucible add Button --dev` → verify `playground/react/src/__generated__/Button/Button.tsx`
  exists, no story file present.
- Run `crucible add Button --dev --stories` → verify all three files inside `Button/` folder.
- Run `crucible add Button --dev --no-stories` with `flags.stories: true` in config → verify story
  is suppressed.
- Run `crucible add Input --dev` twice, edit `Input/Input.tsx`, run again → verify hash protection
  still works with new key format `Input/Input.tsx`.
- Open Storybook after generating with `--stories` → verify stories auto-discovered from subfolder.
- Confirm template resolution: `templates/react/css/Button/Button.tsx.hbs` is read correctly.
- Run full Vitest suite — all pass including updated snapshots.
- Run `npm run test:e2e` — all E2E phases pass including Phase D subfolder assertions.
