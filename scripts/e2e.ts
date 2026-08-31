import { readFile, writeFile, access, mkdir, rm } from 'node:fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import ansis from 'ansis';

const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
const writeJson = (p: string, data: unknown, opts?: { spaces?: number }) =>
  writeFile(p, JSON.stringify(data, null, opts?.spaces ?? 2));
const remove = (p: string) => rm(p, { recursive: true, force: true });
const ensureDir = (p: string) => mkdir(p, { recursive: true });

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const TEST_DIR = path.join(ROOT_DIR, '.e2e-test-env');
const OUT = 'src/components';

interface E2EResult {
  phase: string;
  passed: boolean;
  error?: string;
}

const FRAMEWORKS = ['react', 'vue', 'angular'] as const;
const STYLES = ['css', 'scss', 'tailwind'] as const;
type Framework = (typeof FRAMEWORKS)[number];
type Style = (typeof STYLES)[number];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const a11y = {
  focusRingStyle: 'outline',
  focusRingColor: 'var(--color-primary)',
  focusRingWidth: '2px',
  focusRingOffset: '3px',
  reduceMotion: true,
};

/**
 * Every component is generated across all 3 frameworks × all 3 style systems.
 * `sig` is a deeper regression guard asserted in the React + CSS output.
 */
const COMPONENTS: Array<{ name: string; sig?: string }> = [
  { name: 'Button', sig: 'export const Button' },
  { name: 'Input', sig: 'export const Input' },
  { name: 'Card', sig: 'export const Card' },
  { name: 'Dialog', sig: 'export const Dialog' },
  { name: 'Select', sig: 'export const Select' },
  { name: 'Table', sig: 'export const Table' },
  { name: 'Popover', sig: 'usePopover' },
  { name: 'Toast', sig: 'toast' },
  { name: 'Form', sig: 'export const Form' },
  { name: 'Tabs', sig: 'role="tab"' },
  { name: 'Tooltip', sig: "role: 'tooltip'" },
  { name: 'Label', sig: 'export const Label' },
  { name: 'Separator', sig: "'separator'" },
  { name: 'Badge', sig: 'export const Badge' },
  { name: 'Skeleton', sig: 'aria-busy' },
  { name: 'Avatar', sig: 'role="img"' },
  { name: 'Textarea', sig: '<textarea' },
  { name: 'Checkbox', sig: 'type="checkbox"' },
  { name: 'Switch', sig: 'role="switch"' },
  { name: 'Alert', sig: 'role="alert"' },
  { name: 'Progress', sig: "role: 'progressbar'" },
  { name: 'Breadcrumb', sig: 'aria-label="Breadcrumb"' },
  { name: 'RadioGroup', sig: 'role="radiogroup"' },
  { name: 'Accordion', sig: 'aria-expanded' },
  { name: 'DropdownMenu', sig: "role: 'menu'" },
];

function runCLI(args: string): string {
  try {
    const output = execSync(`node "${CLI_PATH}" ${args}`, { cwd: TEST_DIR, encoding: 'utf-8' }) as string;
    return output;
  } catch (e: any) {
    if (e.stdout) console.log(e.stdout);
    if (e.stderr) console.error(e.stderr);
    throw new Error(e.message);
  }
}

const writeConfig = (framework: Framework, styleSystem: Style, extra: Record<string, unknown> = {}) =>
  writeJson(
    path.join(TEST_DIR, 'crucible.config.json'),
    {
      version: '1.0.0',
      framework,
      styleSystem,
      theme: 'minimal',
      features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
      a11y,
      flags: { outputDir: OUT, stories: false },
      ...extra,
    },
    { spaces: 2 },
  );

const mainRel = (name: string, fw: Framework) =>
  fw === 'react'
    ? `${name}/${name}.tsx`
    : fw === 'vue'
      ? `${name}/${name}.vue`
      : `${name}/${name.toLowerCase()}.component.ts`;

async function runE2E() {
  console.log(ansis.blue('\n🚀 Crucible E2E — full component matrix\n'));
  const results: E2EResult[] = [];

  await remove(TEST_DIR);
  await ensureDir(TEST_DIR);
  await writeJson(
    path.join(TEST_DIR, 'package.json'),
    { name: 'test-project', version: '1.0.0', type: 'module' },
    { spaces: 2 },
  );

  // ==================== COMPONENT MATRIX (components first) ====================
  for (const comp of COMPONENTS) {
    console.log(ansis.cyan(`\n📦 ${comp.name}`));
    for (const fw of FRAMEWORKS) {
      for (const style of STYLES) {
        const phase = `${comp.name} + ${cap(fw)} + ${cap(style)}`;
        try {
          await writeConfig(fw, style);
          await remove(path.join(TEST_DIR, OUT, comp.name));
          runCLI(`add ${comp.name} -y --quiet`);

          const main = path.join(TEST_DIR, OUT, mainRel(comp.name, fw));
          if (!(await pathExists(main))) throw new Error(`missing ${mainRel(comp.name, fw)}`);
          const src = await readFile(main, 'utf-8');

          // Angular is always monolithic (no React-style compound export)
          if (fw === 'angular') {
            if (!src.includes('@Component')) throw new Error('not an Angular @Component');
            if (src.includes(`Object.assign(${comp.name}Root`)) {
              throw new Error('Angular must be monolithic (no compound Object.assign)');
            }
          }

          // Style-system invariants (React CSS modules)
          const cssMod = path.join(TEST_DIR, OUT, `${comp.name}/${comp.name}.module.css`);
          const scssMod = path.join(TEST_DIR, OUT, `${comp.name}/${comp.name}.module.scss`);
          if (fw === 'react' && style === 'css' && !(await pathExists(cssMod))) {
            throw new Error('missing CSS module');
          }
          if (fw === 'react' && style === 'scss' && !(await pathExists(scssMod))) {
            throw new Error('missing SCSS module');
          }
          if (style === 'tailwind') {
            if (await pathExists(cssMod)) throw new Error('Tailwind must not emit a CSS module');
            if (src.includes('.module.css') || src.includes('.module.scss')) {
              throw new Error('Tailwind output must not import a CSS module');
            }
          }

          // Deeper signature guard (React + CSS)
          if (fw === 'react' && style === 'css' && comp.sig && !src.includes(comp.sig)) {
            throw new Error(`missing signature "${comp.sig}"`);
          }

          console.log(ansis.green(`  ✓ ${phase}`));
          results.push({ phase, passed: true });
        } catch (e: any) {
          console.log(ansis.red(`  ✗ ${phase}: ${e.message}`));
          results.push({ phase, passed: false, error: e.message });
        }
      }
    }
  }

  // ==================== REACT NATIVE MATRIX ====================
  console.log(ansis.cyan('\n📱 React Native'));

  // The RN dependency preflight (checkReactNativeSetup) only reads package.json declaratively —
  // it never touches node_modules — so declaring these deps here satisfies it without a real
  // `npm install` on every one of the 10 RN generate calls below. Restored to the plain
  // test-project package.json afterward so it doesn't leak into the web Tailwind checks that run
  // in later sections.
  await writeJson(
    path.join(TEST_DIR, 'package.json'),
    {
      name: 'test-project',
      version: '1.0.0',
      type: 'module',
      dependencies: { 'react-native': '0.76.0', nativewind: '4.0.0', tailwindcss: '3.4.0' },
    },
    { spaces: 2 },
  );

  const RN_COMPONENTS = [
    'Button',
    'Input',
    'Card',
    'Badge',
    'Alert',
    'Label',
    'Avatar',
    'Progress',
    'Separator',
    'Skeleton',
    'Switch',
    'RadioGroup',
    'Textarea',
    'Checkbox',
    'Accordion',
    'Tabs',
    'Dialog',
    'Form',
  ];
  const RN_STYLES = ['nativewind', 'stylesheet'] as const;
  // `OUT` is 'src/components' (2 segments); a component lives one level deeper, so the default
  // layout's relative import back up to the project-root `theme.ts` is 3 levels: `../../../theme`.
  const RN_THEME_IMPORT = '../../../theme';

  const writeRNConfig = (styleSystem: string) =>
    writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react-native',
        styleSystem,
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y,
        flags: { outputDir: OUT, stories: true },
      },
      { spaces: 2 },
    );

  for (const comp of RN_COMPONENTS) {
    for (const style of RN_STYLES) {
      const phase = `RN ${comp} + ${cap(style)}`;
      try {
        await writeRNConfig(style);
        await remove(path.join(TEST_DIR, OUT, comp));
        await remove(path.join(TEST_DIR, 'theme.ts'));
        await remove(path.join(TEST_DIR, 'tailwind.preset.js'));
        runCLI(`add ${comp} --style ${style} -y --quiet`);

        const main = path.join(TEST_DIR, OUT, `${comp}/${comp}.tsx`);
        if (!(await pathExists(main))) throw new Error(`missing ${comp}.tsx`);
        const src = await readFile(main, 'utf-8');

        if (!src.includes("from 'react-native'")) throw new Error('missing react-native import');
        for (const forbidden of ['<div', '<span', '<button', '<input ', 'aria-']) {
          if (src.includes(forbidden)) throw new Error(`RN output must not contain "${forbidden}"`);
        }
        // Passive text components (no interactive role, matching their web counterparts).
        if (!['Badge', 'Label'].includes(comp) && !src.includes('accessibilityRole') && !src.includes('accessibilityState')) {
          throw new Error('missing accessibilityRole/accessibilityState');
        }

        const storiesFile = path.join(TEST_DIR, OUT, `${comp}/${comp}.stories.tsx`);
        if (!(await pathExists(storiesFile))) throw new Error('missing .stories.tsx');

        if (style === 'nativewind') {
          if (!src.includes('className=')) throw new Error('NativeWind output must use className');
          if (!(await pathExists(path.join(TEST_DIR, 'tailwind.preset.js')))) {
            throw new Error('missing tailwind.preset.js at project root');
          }
        } else {
          if (!src.includes('StyleSheet.create')) throw new Error('StyleSheet output must use StyleSheet.create');
          if (!(await pathExists(path.join(TEST_DIR, 'theme.ts')))) {
            throw new Error('missing theme.ts at project root');
          }
          if (!src.includes(`from '${RN_THEME_IMPORT}'`)) {
            throw new Error(`theme import path should be "${RN_THEME_IMPORT}" for the default outputDir depth`);
          }
        }

        console.log(ansis.green(`  ✓ ${phase}`));
        results.push({ phase, passed: true });
      } catch (e: any) {
        console.log(ansis.red(`  ✗ ${phase}: ${e.message}`));
        results.push({ phase, passed: false, error: e.message });
      }
    }
  }

  {
    const phase = 'RN theme import path honours a custom outputDir';
    try {
      await writeJson(
        path.join(TEST_DIR, 'crucible.config.json'),
        {
          version: '1.0.0',
          framework: 'react-native',
          styleSystem: 'stylesheet',
          theme: 'minimal',
          features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
          a11y,
          flags: { outputDir: 'app/ui/components', stories: false },
        },
        { spaces: 2 },
      );
      await remove(path.join(TEST_DIR, 'app'));
      await remove(path.join(TEST_DIR, 'theme.ts'));
      runCLI('add Button --style stylesheet -y --quiet');
      const src = await readFile(path.join(TEST_DIR, 'app/ui/components/Button/Button.tsx'), 'utf-8');
      if (!src.includes("from '../../../../theme'")) {
        throw new Error('theme import path did not adapt to the custom 3-level outputDir');
      }
      console.log(ansis.green(`  ✓ ${phase}`));
      results.push({ phase, passed: true });
    } catch (e: any) {
      console.log(ansis.red(`  ✗ ${phase}: ${e.message}`));
      results.push({ phase, passed: false, error: e.message });
    }
  }

  await writeJson(
    path.join(TEST_DIR, 'package.json'),
    { name: 'test-project', version: '1.0.0', type: 'module' },
    { spaces: 2 },
  );
  await remove(path.join(TEST_DIR, 'app'));
  await remove(path.join(TEST_DIR, 'theme.ts'));
  await remove(path.join(TEST_DIR, 'tailwind.preset.js'));

  // ==================== CLI / INFRASTRUCTURE ====================
  console.log(ansis.cyan('\n🔧 CLI & infrastructure'));

  const infra = async (phase: string, fn: () => Promise<void>) => {
    try {
      await fn();
      console.log(ansis.green(`  ✓ ${phase}`));
      results.push({ phase, passed: true });
    } catch (e: any) {
      console.log(ansis.red(`  ✗ ${phase}: ${e.message}`));
      results.push({ phase, passed: false, error: e.message });
    }
  };

  await infra('Dry Run Mode', async () => {
    await writeConfig('react', 'css');
    await remove(path.join(TEST_DIR, OUT, 'Button'));
    runCLI('add Button --dry-run -y --quiet');
    if (await pathExists(path.join(TEST_DIR, OUT, 'Button/Button.tsx'))) {
      throw new Error('dry-run should not write files');
    }
  });

  await infra('Force Flag', async () => {
    await writeConfig('react', 'css');
    await remove(path.join(TEST_DIR, OUT, 'Button'));
    runCLI('add Button -y --quiet');
    const p = path.join(TEST_DIR, OUT, 'Button/Button.tsx');
    await writeFile(p, '// user edit\n');
    runCLI('add Button -y --force --quiet');
    const after = await readFile(p, 'utf-8');
    if (after.includes('// user edit')) throw new Error('--force should overwrite user edits');
  });

  await infra('Hash Protection', async () => {
    await writeConfig('react', 'css');
    await remove(path.join(TEST_DIR, OUT, 'Button'));
    runCLI('add Button -y --quiet');
    const p = path.join(TEST_DIR, OUT, 'Button/Button.tsx');
    await writeFile(p, '// precious user edit\n');
    runCLI('add Button -y --quiet'); // no --force
    const after = await readFile(p, 'utf-8');
    if (!after.includes('// precious user edit')) throw new Error('user edits must be preserved without --force');
  });

  await infra('Multi-Component Generation', async () => {
    await writeConfig('react', 'css');
    for (const c of ['Button', 'Input', 'Card']) await remove(path.join(TEST_DIR, OUT, c));
    runCLI('add Button Input Card -y --quiet');
    for (const c of ['Button', 'Input', 'Card']) {
      if (!(await pathExists(path.join(TEST_DIR, OUT, `${c}/${c}.tsx`)))) throw new Error(`missing ${c}`);
    }
  });

  await infra('Soft Theme Preset', async () => {
    await writeConfig('react', 'css', { theme: 'soft' });
    await remove(path.join(TEST_DIR, OUT, 'Button'));
    runCLI('add Button -t soft -y --quiet');
    if (!(await pathExists(path.join(TEST_DIR, OUT, 'Button/Button.tsx')))) throw new Error('soft theme generation failed');
  });

  await infra('Custom Output Directory', async () => {
    await writeConfig('react', 'css', { flags: { outputDir: 'src/ui', stories: false } });
    await remove(path.join(TEST_DIR, 'src/ui'));
    runCLI('add Button -y --quiet');
    if (!(await pathExists(path.join(TEST_DIR, 'src/ui/Button/Button.tsx')))) throw new Error('custom outputDir not honored');
  });

  await infra('Init Command', async () => {
    const cfg = path.join(TEST_DIR, 'crucible.config.json');
    await remove(cfg);
    runCLI('init -y');
    if (!(await pathExists(cfg))) throw new Error('init did not create config');
  });

  await infra('List Command', async () => {
    const out = runCLI('list');
    for (const c of ['Button', 'DropdownMenu', 'Accordion']) {
      if (!out.includes(c)) throw new Error(`list output missing ${c}`);
    }
  });

  await infra('Error Handling (Unknown Component)', async () => {
    await writeConfig('react', 'css');
    let threw = false;
    try {
      runCLI('add NonExistentComponent -y --quiet');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('unknown component should fail');
  });

  await infra('CLI --version matches package.json', async () => {
    const pkg = JSON.parse(await readFile(path.join(ROOT_DIR, 'package.json'), 'utf-8'));
    const reported = runCLI('--version').trim();
    if (reported !== pkg.version) {
      throw new Error(`crucible --version = "${reported}", expected "${pkg.version}"`);
    }
  });

  // ==================== LIFECYCLE COMMANDS (info/status/diff/update/remove) ====================
  console.log(ansis.cyan('\n🧪 Component lifecycle commands'));

  const CMD = 'cmd-suite';
  const CMD_DIR = path.join(TEST_DIR, CMD);
  const cmdConfig = (extra: Record<string, unknown> = {}) =>
    writeJson(
      path.join(CMD_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y,
        flags: { outputDir: OUT, stories: false },
        ...extra,
      },
      { spaces: 2 },
    );

  await infra('info --json + unknown component errors', async () => {
    const m = JSON.parse(runCLI('info Button --json'));
    if (m.id !== 'Button' || !m.variants.includes('primary')) {
      throw new Error('info --json returned unexpected shape');
    }
    let threw = false;
    try {
      runCLI('info DefinitelyNotARealComponent --json');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('info should fail for an unknown component');
  });

  await infra('list --json', async () => {
    const arr = JSON.parse(runCLI('list --json'));
    if (!Array.isArray(arr) || !arr.some((c: any) => c.id === 'Button')) {
      throw new Error('list --json missing Button');
    }
  });

  await infra('status/diff/update/remove lifecycle (isolated cwd)', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), { name: 'cmd-suite', dependencies: {} });
    await cmdConfig();
    runCLI(`add Button --cwd ${CMD} -y --quiet`);
    const main = path.join(CMD_DIR, OUT, 'Button/Button.tsx');

    // Clean state right after add.
    const clean = JSON.parse(runCLI(`status --cwd ${CMD} --json`));
    if (clean.summary.missing !== 0 || clean.summary.modified !== 0) {
      throw new Error('expected a clean status immediately after add');
    }
    const d0 = JSON.parse(runCLI(`diff --cwd ${CMD} --json`));
    if (d0.changed.length !== 0) throw new Error('expected no diff immediately after add');

    // Edit → status reports modified (informational, still exit 0); diff detects it.
    await writeFile(main, (await readFile(main, 'utf-8')) + '\n// drift\n');
    const mod = JSON.parse(runCLI(`status --cwd ${CMD} --json`));
    if (mod.summary.modified < 1) throw new Error('status should report a modified file after an edit');
    const d1 = JSON.parse(runCLI(`diff --cwd ${CMD} --json`));
    if (!d1.changed.some((c: any) => c.status === 'modified')) {
      throw new Error('diff should detect the edited file');
    }

    // update preserves edits without --force, overwrites with it.
    runCLI(`update Button --cwd ${CMD} -y --quiet`);
    if (!(await readFile(main, 'utf-8')).includes('// drift')) {
      throw new Error('update must preserve user edits without --force');
    }
    runCLI(`update Button --cwd ${CMD} -y --force --quiet`);
    if ((await readFile(main, 'utf-8')).includes('// drift')) {
      throw new Error('update --force must overwrite user edits');
    }

    // Missing tracked file → status exits non-zero.
    await remove(main);
    let statusFailed = false;
    try {
      runCLI(`status --cwd ${CMD} --json`);
    } catch {
      statusFailed = true;
    }
    if (!statusFailed) throw new Error('status should exit non-zero when a tracked file is missing');

    // remove deletes the component dir and untracks its files.
    runCLI(`remove Button --cwd ${CMD} -y --quiet`);
    if (await pathExists(path.join(CMD_DIR, OUT, 'Button'))) {
      throw new Error('remove should delete the component directory');
    }
    const after = JSON.parse(runCLI(`status --cwd ${CMD} --json`));
    if (after.files.some((f: any) => f.file.startsWith('Button/'))) {
      throw new Error('remove should untrack the component files');
    }

    await remove(CMD_DIR);
  });

  await infra('doctor --json emits a parseable report', async () => {
    await writeConfig('react', 'css');
    // doctor exits non-zero when a check fails, but still prints JSON to stdout — capture either way.
    let stdout: string;
    try {
      stdout = execSync(`node "${CLI_PATH}" doctor --json`, { cwd: TEST_DIR, encoding: 'utf-8' });
    } catch (e: any) {
      stdout = (e.stdout as string) ?? '';
    }
    const report = JSON.parse(stdout);
    if (typeof report.allPassed !== 'boolean') {
      throw new Error('doctor --json must include a boolean allPassed');
    }
  });

  await infra('add --framework overrides config framework in output', async () => {
    await writeConfig('react', 'css'); // config says react...
    await remove(path.join(TEST_DIR, OUT, 'Button'));
    runCLI('add Button --framework vue -y --quiet'); // ...but flag says vue
    if (!(await pathExists(path.join(TEST_DIR, OUT, 'Button/Button.vue')))) {
      throw new Error('--framework vue should emit Button.vue');
    }
    if (await pathExists(path.join(TEST_DIR, OUT, 'Button/Button.tsx'))) {
      throw new Error('--framework vue must not emit a React .tsx');
    }
    await remove(path.join(TEST_DIR, OUT, 'Button'));
  });

  await infra('remove --dry-run leaves files on disk', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), { name: 'cmd-suite', dependencies: {} });
    await cmdConfig();
    runCLI(`add Button --cwd ${CMD} -y --quiet`);
    runCLI(`remove Button --cwd ${CMD} --dry-run`);
    if (!(await pathExists(path.join(CMD_DIR, OUT, 'Button')))) {
      throw new Error('remove --dry-run must not delete the component directory');
    }
    await remove(CMD_DIR);
  });

  // ==================== PLUG-AND-PLAY (LOCAL PLUGINS) ====================
  console.log(ansis.cyan('\n🔌 Plug-and-play (.crucible/plugins)'));

  await infra('Plugin: external component generates (plug-and-play)', async () => {
    const pluginRoot = path.join(TEST_DIR, '.crucible/plugins/e2e-demo');
    await ensureDir(path.join(pluginRoot, 'components'));
    await ensureDir(path.join(pluginRoot, 'templates/react/css/Pill'));

    await writeJson(path.join(pluginRoot, 'plugin.json'), {
      id: 'e2e-demo',
      name: 'E2E Demo Plugin',
      version: '1.0.0',
      engineVersion: '>=1.0.0',
      components: ['components/pill.json'],
      templatesDir: './templates',
    });
    await writeJson(path.join(pluginRoot, 'components/pill.json'), {
      id: 'Pill',
      name: 'Pill',
      description: 'Demo plugin component',
      frameworks: ['react', 'vue', 'angular'],
      styleSystems: ['css', 'scss', 'tailwind'],
      variants: ['default'],
      sizes: [],
      states: [],
      props: [],
      prefix: 'pill',
      tailwindDefaults: {},
    });
    await writeFile(
      path.join(pluginRoot, 'templates/react/css/Pill/Pill.tsx.hbs'),
      [
        "import React from 'react';",
        "import styles from './Pill.module.css';",
        '',
        'export interface PillProps {',
        '  children?: React.ReactNode;',
        '  className?: string;',
        '}',
        '',
        'export const Pill = ({ children, className }: PillProps) => (',
        '  <span data-prefix="{{prefix}}" className={[styles.pill, className].filter(Boolean).join(\' \')}>',
        '    {children}',
        '  </span>',
        ');',
        '',
      ].join('\n'),
    );
    await writeFile(
      path.join(pluginRoot, 'templates/react/css/Pill/Pill.module.css.hbs'),
      [
        '.pill {',
        '  display: inline-flex;',
        '  align-items: center;',
        '  border-radius: 9999px;',
        '  padding: 2px 10px;',
        '  background: var(--{{prefix}}-bg, var(--color-primary));',
        '  color: #fff;',
        '}',
        '',
      ].join('\n'),
    );

    await writeConfig('react', 'css');
    await remove(path.join(TEST_DIR, OUT, 'Pill'));
    runCLI('add Pill -y --quiet');

    const main = path.join(TEST_DIR, OUT, 'Pill/Pill.tsx');
    if (!(await pathExists(main))) throw new Error('plugin component Pill.tsx not generated');
    const src = await readFile(main, 'utf-8');
    if (!src.includes('export const Pill')) throw new Error('Pill missing expected export');
    if (!src.includes('data-prefix="pill"')) throw new Error('plugin manifest prefix not applied to output');
    if (!(await pathExists(path.join(TEST_DIR, OUT, 'Pill/Pill.module.css')))) {
      throw new Error('plugin CSS module not generated from plugin templatesDir');
    }
  });

  await infra('Plugin: external component appears in `list`', async () => {
    const out = runCLI('list');
    if (!out.includes('Pill')) throw new Error('plugin component missing from `list` output');
  });

  await infra('Plugin: incompatible engineVersion is skipped', async () => {
    const futureRoot = path.join(TEST_DIR, '.crucible/plugins/e2e-future');
    await ensureDir(path.join(futureRoot, 'components'));
    await writeJson(path.join(futureRoot, 'plugin.json'), {
      id: 'e2e-future',
      name: 'Future Plugin',
      version: '1.0.0',
      engineVersion: '>=99.0.0',
      components: ['components/ghostbox.json'],
      templatesDir: './templates',
    });
    await writeJson(path.join(futureRoot, 'components/ghostbox.json'), {
      id: 'Ghostbox',
      name: 'Ghostbox',
      frameworks: ['react'],
      styleSystems: ['css'],
      variants: [],
      sizes: [],
      states: [],
      props: [],
      prefix: 'ghostbox',
      tailwindDefaults: {},
    });

    const out = runCLI('list');
    if (out.includes('Ghostbox')) throw new Error('incompatible plugin component must not be registered');

    // Tidy plugin fixtures so the shared scratch dir stays clean for teardown.
    await remove(path.join(TEST_DIR, '.crucible'));
  });

  await infra('Plugin: component id collision errors under --strict', async () => {
    const collideRoot = path.join(TEST_DIR, '.crucible/plugins/e2e-collide');
    await ensureDir(path.join(collideRoot, 'components'));
    await writeJson(path.join(collideRoot, 'plugin.json'), {
      id: 'e2e-collide',
      name: 'Collide Plugin',
      version: '1.0.0',
      engineVersion: '>=1.0.0',
      components: ['components/button.json'],
      templatesDir: './templates',
    });
    // Re-uses the core "Button" id → collision.
    await writeJson(path.join(collideRoot, 'components/button.json'), {
      id: 'Button',
      name: 'Button',
      frameworks: ['react'],
      styleSystems: ['css'],
      variants: [],
      sizes: [],
      states: [],
      props: [],
      prefix: 'button',
      tailwindDefaults: {},
    });

    // Without --strict: collision warns + overrides, exits 0.
    runCLI('list');

    // With --strict: collision is a hard error (non-zero exit → runCLI throws).
    let threw = false;
    try {
      runCLI('list --strict');
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('expected --strict to error on component id collision');

    await remove(path.join(TEST_DIR, '.crucible'));
  });

  // ==================== MIGRATION ENGINE (audit/diff/upgrade) ====================
  console.log(ansis.cyan('\n🔀 Migration engine (audit/diff/upgrade)'));

  await infra('audit --json exit codes (0 clean, 1 diverged)', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), { name: 'cmd-suite', dependencies: {} });
    await cmdConfig();
    runCLI(`add Button --cwd ${CMD} -y --quiet`);

    let cleanFailed = false;
    try {
      runCLI(`audit --cwd ${CMD} --json`);
    } catch {
      cleanFailed = true;
    }
    if (cleanFailed) throw new Error('audit should exit 0 on a clean tree');

    // Doctor a stale BASE + a disk edit on top of it: both disk and render now differ from
    // BASE → diverged.
    const manifestPath = path.join(CMD_DIR, '.crucible/manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const key = 'Button/Button.tsx';
    const real = manifest.files[key].baseContent;
    const staleBase = real.replace('export const Button', 'export const StaleButton');
    manifest.files[key].baseContent = staleBase;
    await writeJson(manifestPath, manifest);
    await writeFile(path.join(CMD_DIR, OUT, 'Button/Button.tsx'), staleBase + '\n// user edit\n');

    let divergedFailed = false;
    try {
      runCLI(`audit --cwd ${CMD} --json`);
    } catch {
      divergedFailed = true;
    }
    if (!divergedFailed) throw new Error('audit should exit 1 when a file has diverged');

    await remove(CMD_DIR);
  });

  await infra('legacy (v1) manifest upgrade degrades safely — never merges blind', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), { name: 'cmd-suite', dependencies: {} });
    await cmdConfig();
    runCLI(`add Button --cwd ${CMD} -y --quiet`);

    // Simulate a manifest written by a pre-M0 Crucible: strip the v2 fields (baseContent/source).
    const manifestPath = path.join(CMD_DIR, '.crucible/manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    for (const meta of Object.values(manifest.files) as any[]) {
      delete meta.baseContent;
      delete meta.source;
    }
    delete manifest.version;
    await writeJson(manifestPath, manifest);

    const main = path.join(CMD_DIR, OUT, 'Button/Button.tsx');
    const original = await readFile(main, 'utf-8');
    await writeFile(main, original + '\n// legacy user edit\n');

    runCLI(`upgrade Button --cwd ${CMD} -y --quiet`);

    const after = await readFile(main, 'utf-8');
    if (!after.includes('// legacy user edit')) {
      throw new Error('legacy user-edited file must be preserved, never merged blind');
    }
    if (after.includes('<<<<<<<')) {
      throw new Error('a legacy (no BASE) entry must never produce conflict markers');
    }

    await remove(CMD_DIR);
  });

  await infra('upgrade --yes with a real conflict writes markers and exits non-zero', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), { name: 'cmd-suite', dependencies: {} });
    await cmdConfig();
    runCLI(`add Button --cwd ${CMD} -y --quiet`);

    const manifestPath = path.join(CMD_DIR, '.crucible/manifest.json');
    const manifest = JSON.parse(await readFile(manifestPath, 'utf-8'));
    const key = 'Button/Button.tsx';
    const real = manifest.files[key].baseContent;
    // BASE and OURS both diverge from THEIRS at the same spot, with different edits → conflict.
    manifest.files[key].baseContent = real.replace('export const Button', 'export const StaleButton');
    await writeJson(manifestPath, manifest);
    const main = path.join(CMD_DIR, OUT, 'Button/Button.tsx');
    await writeFile(main, real.replace('export const Button', 'export const MyButton'));

    let threw = false;
    try {
      runCLI(`upgrade Button --cwd ${CMD} -y --quiet`);
    } catch {
      threw = true;
    }
    if (!threw) throw new Error('upgrade should exit non-zero when it writes unresolved conflict markers');

    const written = await readFile(main, 'utf-8');
    for (const marker of ['<<<<<<<', '|||||||', '=======', '>>>>>>>']) {
      if (!written.includes(marker)) throw new Error(`expected conflict marker "${marker}" in the written file`);
    }

    await remove(CMD_DIR);
  });

  await infra('plugin-shadow upgrade: a real upstream template change merges with a user edit', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), { name: 'cmd-suite', dependencies: {} });
    await cmdConfig();
    runCLI(`add Button --cwd ${CMD} -y --quiet`);

    const main = path.join(CMD_DIR, OUT, 'Button/Button.tsx');
    const cssModule = path.join(CMD_DIR, OUT, 'Button/Button.module.css');
    const originalTsx = await readFile(main, 'utf-8');
    const originalCss = await readFile(cssModule, 'utf-8');

    // User edits the file before any upstream change exists.
    await writeFile(main, originalTsx + '\n// user edit marker\n');

    // Simulate a real upstream template improvement via the shadowing mechanism confirmed in the
    // M4 spike: a local plugin declaring the same component id ("Button") fully overrides core's
    // template. One line inserted near the top, far from the user's edit at the end, so a 3-way
    // merge has an anchor and can combine both changes cleanly.
    const pluginRoot = path.join(CMD_DIR, '.crucible/plugins/e2e-shadow-upgrade');
    await ensureDir(path.join(pluginRoot, 'components'));
    await ensureDir(path.join(pluginRoot, 'templates/react/css/Button'));
    await writeJson(path.join(pluginRoot, 'plugin.json'), {
      id: 'e2e-shadow-upgrade',
      name: 'Shadow Upgrade Plugin',
      version: '1.0.0',
      engineVersion: '>=1.0.0',
      components: ['components/button.json'],
      templatesDir: './templates',
    });
    await writeJson(path.join(pluginRoot, 'components/button.json'), {
      id: 'Button',
      name: 'Button',
      description: 'Shadow-upgraded Button',
      frameworks: ['react'],
      styleSystems: ['css'],
      variants: ['default'],
      sizes: [],
      states: [],
      props: [],
      prefix: 'button',
      tailwindDefaults: {},
    });
    const tsxLines = originalTsx.split('\n');
    const upgradedTsx = [tsxLines[0], '// UPGRADED_UPSTREAM', ...tsxLines.slice(1)].join('\n');
    await writeFile(path.join(pluginRoot, 'templates/react/css/Button/Button.tsx.hbs'), upgradedTsx);
    await writeFile(path.join(pluginRoot, 'templates/react/css/Button/Button.module.css.hbs'), originalCss);

    runCLI(`upgrade Button --cwd ${CMD} -y --quiet`);

    const merged = await readFile(main, 'utf-8');
    if (!merged.includes('// user edit marker')) {
      throw new Error('upgrade must never silently drop a user edit, merged or in conflict markers');
    }
    if (!merged.includes('UPGRADED_UPSTREAM')) {
      throw new Error('upgrade should bring in the real upstream template change');
    }

    await remove(pluginRoot);
    await remove(CMD_DIR);
  });

  await infra('RN component: upgrade behaves identically to a web component (no RN special-casing)', async () => {
    await remove(CMD_DIR);
    await ensureDir(CMD_DIR);
    await writeJson(path.join(CMD_DIR, 'package.json'), {
      name: 'cmd-suite',
      dependencies: { 'react-native': '0.76.0', nativewind: '4.0.0', tailwindcss: '3.4.0' },
    });
    await writeJson(path.join(CMD_DIR, 'crucible.config.json'), {
      version: '1.0.0',
      framework: 'react-native',
      styleSystem: 'stylesheet',
      theme: 'minimal',
      features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
      a11y,
      flags: { outputDir: OUT, stories: false },
    });
    runCLI(`add Button --cwd ${CMD} -y --quiet`);

    const main = path.join(CMD_DIR, OUT, 'Button/Button.tsx');
    await writeFile(main, (await readFile(main, 'utf-8')) + '\n// RN user edit\n');

    const auditReport = JSON.parse(runCLI(`audit --cwd ${CMD} --json`));
    if ((auditReport.counts['user-edited'] ?? 0) < 1) {
      throw new Error('an RN user edit should classify as user-edited, same as any other framework');
    }

    runCLI(`upgrade Button --cwd ${CMD} -y --quiet`);
    if (!(await readFile(main, 'utf-8')).includes('// RN user edit')) {
      throw new Error('an RN user-edited file must be preserved by upgrade, same as any other framework');
    }

    await remove(CMD_DIR);
  });

  console.log(ansis.gray('\n🧹 Cleaning up...'));
  await remove(TEST_DIR);

  console.log(ansis.bold('\n📊 Test Results Summary:\n'));
  let passed = 0;
  let failed = 0;
  for (const result of results) {
    if (result.passed) {
      passed++;
    } else {
      console.log(ansis.red(`  ✗ ${result.phase}: ${result.error}`));
      failed++;
    }
  }
  console.log(ansis.bold(`\n  Total: ${passed} passed, ${failed} failed\n`));

  if (failed === 0) {
    console.log(ansis.green.bold('🎉 All E2E tests passed!\n'));
  } else {
    console.log(ansis.red.bold(`❌ ${failed} test(s) failed.\n`));
    process.exitCode = 1;
  }
}

runE2E();
