import { readFile, writeFile, access, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import ansis from 'ansis';

const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
const writeJson = (p: string, data: unknown, opts?: { spaces?: number }) =>
  writeFile(p, JSON.stringify(data, null, opts?.spaces ?? 2));
const remove = (p: string) => rm(p, { recursive: true, force: true });
const ensureDir = (p: string) => mkdir(p, { recursive: true });

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const TEST_DIR = path.join(ROOT_DIR, '.e2e-test-env');

interface E2EResult {
  phase: string;
  passed: boolean;
  error?: string;
}

function runCLI(args: string): string {
  try {
    const output = execSync(`node "${CLI_PATH}" ${args}`, {
      cwd: TEST_DIR,
      encoding: 'utf-8',
    }) as string;
    if (output) console.log(output);
    return output;
  } catch (e: any) {
    if (e.stdout) {
      console.log(e.stdout);
    }
    if (e.stderr) {
      console.error(e.stderr);
    }
    throw new Error(e.message);
  }
}

async function runE2E() {
  console.log(ansis.blue('\n🚀 Starting Comprehensive E2E Test Suite...\n'));
  const results: E2EResult[] = [];

  // Cleanup previous test runs
  await remove(TEST_DIR);
  await ensureDir(TEST_DIR);

  try {
    // Setup basic package.json
    await writeJson(
      path.join(TEST_DIR, 'package.json'),
      { name: 'test-project', version: '1.0.0', type: 'module' },
      { spaces: 2 },
    );

    // ==================== REACT TESTS ====================
    console.log(ansis.cyan('\n�️ REACT FRAMEWORK'));

    // React + CSS
    console.log(ansis.cyan('📦 Phase 1: React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    runCLI('add Button --stories -y');
    const reactCssFiles = [
      'Button/Button.tsx',
      'Button/Button.module.css',
      'Button/Button.stories.tsx',
    ];
    for (const file of reactCssFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    results.push({ phase: 'React + CSS + Button', passed: true });

    // React + SCSS
    console.log(ansis.cyan('📦 Phase 2: React + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Button'));
    runCLI('add Button -y');
    if (
      !(await pathExists(path.join(TEST_DIR, 'src/components', 'Button', 'Button.module.scss')))
    ) {
      throw new Error('Missing: Button/Button.module.scss');
    }
    results.push({ phase: 'React + SCSS + Button', passed: true });

    // React + Tailwind
    console.log(ansis.cyan('📦 Phase 3: React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Button'));
    runCLI('add Input Card -y');
    for (const comp of ['Input', 'Card']) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', comp, `${comp}.tsx`)))) {
        throw new Error(`Missing: ${comp}/${comp}.tsx`);
      }
      const cssPath = path.join(TEST_DIR, 'src/components', comp, `${comp}.module.css`);
      if (await pathExists(cssPath)) {
        throw new Error(`${comp} should not have CSS module in Tailwind mode`);
      }
    }
    results.push({ phase: 'React + Tailwind + Input/Card', passed: true });

    // ==================== ANGULAR TESTS ====================
    console.log(ansis.cyan('\n🅰️ ANGULAR FRAMEWORK'));

    // Angular + CSS
    console.log(ansis.cyan('📦 Phase 4: Angular + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await writeJson(
      path.join(TEST_DIR, 'tsconfig.json'),
      {
        compilerOptions: {
          target: 'ESNext',
          experimentalDecorators: true,
          emitDecoratorMetadata: true,
          moduleResolution: 'Node',
          strict: true,
        },
        include: ['src'],
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Input'));
    await remove(path.join(TEST_DIR, 'src/components', 'Card'));
    console.log(ansis.gray('  Running: crucible add Dialog -y --verbose'));
    try {
      runCLI('add Dialog -y --verbose');
    } catch (e: any) {
      console.log(ansis.red('  CLI Error:'), e.message);
      throw e;
    }
    console.log(ansis.gray('  Checking files...'));
    const componentsDir = path.join(TEST_DIR, 'src/components');
    if (await pathExists(componentsDir)) {
      const dirs = await readdir(componentsDir);
      console.log(ansis.gray(`  Components dir contains: ${dirs.join(', ')}`));
      for (const dir of dirs) {
        const files = await readdir(path.join(componentsDir, dir));
        console.log(ansis.gray(`    ${dir}: ${files.join(', ')}`));
      }
    } else {
      console.log(ansis.gray('  Components dir does not exist'));
    }
    const angularCssFiles = [
      'Dialog/dialog.component.ts',
      'Dialog/dialog.component.html',
      'Dialog/dialog.component.css',
    ];
    for (const file of angularCssFiles) {
      const filePath = path.join(TEST_DIR, 'src/components', file);
      if (!(await pathExists(filePath))) {
        console.log(ansis.red(`  Missing: ${file}`));
        throw new Error(`Missing: ${file}`);
      } else {
        console.log(ansis.green(`  Found: ${file}`));
      }
    }
    results.push({ phase: 'Angular + CSS + Dialog', passed: true });

    // Angular + SCSS
    console.log(ansis.cyan('📦 Phase 5: Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'dialog'));
    runCLI('add Dialog -y');
    const angularScssFiles = [
      'Dialog/dialog.component.ts',
      'Dialog/dialog.component.html',
      'Dialog/dialog.component.scss',
    ];
    for (const file of angularScssFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    results.push({ phase: 'Angular + SCSS + Dialog', passed: true });

    // Angular + Tailwind
    console.log(ansis.cyan('📦 Phase 6: Angular + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'dialog'));
    runCLI('add Dialog -y');
    const angularTailwindFiles = ['Dialog/dialog.component.ts', 'Dialog/dialog.component.html'];
    for (const file of angularTailwindFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const hasAngularTailwindCss = await pathExists(
      path.join(TEST_DIR, 'src/components', 'dialog', 'dialog.component.css'),
    );
    if (hasAngularTailwindCss) {
      throw new Error('Angular + Tailwind should not create CSS files');
    }
    results.push({ phase: 'Angular + Tailwind + Dialog', passed: true });

    // ==================== VUE TESTS ====================
    console.log(ansis.cyan('\n💚 VUE FRAMEWORK'));

    // Vue + CSS
    console.log(ansis.cyan('📦 Phase 7: Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    runCLI('add Select --stories -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Select', 'Select.vue')))) {
      throw new Error('Missing: Select/Select.vue');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Select', 'Select.stories.ts')))) {
      throw new Error('Missing: Select/Select.stories.ts');
    }
    results.push({ phase: 'Vue + CSS + Select', passed: true });

    // Vue + SCSS
    console.log(ansis.cyan('📦 Phase 8: Vue + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Select'));
    runCLI('add Button -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Button', 'Button.vue')))) {
      throw new Error('Missing: Button/Button.vue');
    }
    results.push({ phase: 'Vue + SCSS + Button', passed: true });

    // Vue + Tailwind
    console.log(ansis.cyan('📦 Phase 9: Vue + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Button'));
    runCLI('add Button -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Button', 'Button.vue')))) {
      throw new Error('Missing: Button/Button.vue');
    }
    const hasVueTailwindCss = await pathExists(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.module.css'),
    );
    if (hasVueTailwindCss) {
      throw new Error('Vue + Tailwind should not create CSS module files');
    }
    results.push({ phase: 'Vue + Tailwind + Button', passed: true });

    // ==================== FEATURE TESTS ====================
    console.log(ansis.cyan('\n⚙️ FEATURE TESTS'));

    // Dry Run
    console.log(ansis.cyan('📦 Phase 10: Dry Run Mode'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Button'));
    runCLI('add Button -y');
    const originalButtonContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      'utf-8',
    );
    runCLI('add Button --dry-run -y');
    const afterDryRunContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      'utf-8',
    );
    if (originalButtonContent !== afterDryRunContent) {
      throw new Error('Dry run modified file');
    }
    results.push({ phase: 'Dry Run Mode', passed: true });

    // Force Flag
    console.log(ansis.cyan('📦 Phase 11: Force Flag'));
    await writeFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      '// Modified by user',
    );
    runCLI('add Button --force -y');
    const afterForceContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      'utf-8',
    );
    if (afterForceContent.includes('// Modified by user')) {
      throw new Error('Force flag did not overwrite modified file');
    }
    results.push({ phase: 'Force Flag', passed: true });

    // Hash Protection
    console.log(ansis.cyan('📦 Phase 12: Hash Protection'));
    // Generate Input component first for hash protection test
    runCLI('add Input -y');
    await writeFile(
      path.join(TEST_DIR, 'src/components', 'Input', 'Input.tsx'),
      '// User modification that should be protected',
    );
    runCLI('add Input -y');
    const inputContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Input', 'Input.tsx'),
      'utf-8',
    );
    if (!inputContent.includes('User modification')) {
      throw new Error('Hash protection did not work - file was overwritten');
    }
    results.push({ phase: 'Hash Protection', passed: true });

    // Multi-Component
    console.log(ansis.cyan('📦 Phase 13: Multi-Component Generation'));
    await remove(path.join(TEST_DIR, 'src/components', 'Button'));
    await remove(path.join(TEST_DIR, 'src/components', 'Select'));
    runCLI('add Button Input Card Dialog Select --no-stories -y');
    for (const comp of ['Button', 'Input', 'Card', 'Dialog', 'Select']) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', comp, `${comp}.tsx`)))) {
        throw new Error(`Missing multi-component: ${comp}`);
      }
      const hasStoriesTsx = await pathExists(
        path.join(TEST_DIR, 'src/components', comp, `${comp}.stories.tsx`),
      );
      const hasStoriesTs = await pathExists(
        path.join(TEST_DIR, 'src/components', comp, `${comp}.stories.ts`),
      );
      if (hasStoriesTsx || hasStoriesTs) {
        throw new Error(`${comp} should not have stories with --no-stories`);
      }
    }
    results.push({ phase: 'Multi-Component Generation', passed: true });

    // Theme Presets
    console.log(ansis.cyan('📦 Phase 14: Theme Presets'));
    await remove(path.join(TEST_DIR, 'public/__generated__/tokens.css'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'soft',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    runCLI('add Card --force -y');
    const tokensContent = await readFile(
      path.join(TEST_DIR, 'public/__generated__/tokens.css'),
      'utf-8',
    );
    if (!tokensContent.includes('#7C3AED')) {
      throw new Error('Soft theme tokens not applied');
    }
    results.push({ phase: 'Soft Theme Preset', passed: true });

    // Custom Output Directory
    console.log(ansis.cyan('📦 Phase 15: Custom Output Directory'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        flags: { outputDir: 'custom/components' },
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    runCLI('add Button --force -y');
    if (!(await pathExists(path.join(TEST_DIR, 'custom/components', 'Button', 'Button.tsx')))) {
      throw new Error('Custom output directory not used');
    }
    results.push({ phase: 'Custom Output Directory', passed: true });

    // ==================== CLI COMMAND TESTS ====================
    console.log(ansis.cyan('\n🖥️ CLI COMMANDS'));

    // Init Command
    console.log(ansis.cyan('📦 Phase 16: Init Command'));
    await remove(path.join(TEST_DIR, 'crucible.config.json'));
    runCLI('init -y');
    if (!(await pathExists(path.join(TEST_DIR, 'crucible.config.json')))) {
      throw new Error('Init command failed');
    }
    results.push({ phase: 'Init Command', passed: true });

    // Eject Command
    console.log(ansis.cyan('📦 Phase 17: Eject Command'));
    runCLI('eject');
    const ejectedConfig = await readJson(path.join(TEST_DIR, 'crucible.config.json'));
    if (ejectedConfig.theme !== 'custom') {
      throw new Error('Eject did not change theme to custom');
    }
    if (!ejectedConfig.tokens?.color?.primary) {
      throw new Error('Eject did not inject tokens');
    }
    results.push({ phase: 'Eject Command', passed: true });

    // List Command
    console.log(ansis.cyan('📦 Phase 18: List Command'));
    const listOutput = runCLI('list');
    if (!listOutput.includes('Button') || !listOutput.includes('react')) {
      throw new Error('List command did not show components');
    }
    results.push({ phase: 'List Command', passed: true });

    // Error Handling
    console.log(ansis.cyan('📦 Phase 19: Error Handling'));
    try {
      runCLI('add UnknownComponent -y');
      throw new Error('Should have failed for unknown component');
    } catch (e: any) {
      if (!e.message.includes('Unknown component')) {
        throw new Error('Wrong error message for unknown component');
      }
    }
    results.push({ phase: 'Error Handling (Unknown Component)', passed: true });

    // ==================== TABLE COMPONENT TESTS ====================
    console.log(ansis.cyan('\n📊 TABLE COMPONENT'));

    // Table + React + CSS
    console.log(ansis.cyan('📦 Phase 20: Table + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Input'));
    await remove(path.join(TEST_DIR, 'src/components', 'Card'));
    await remove(path.join(TEST_DIR, 'src/components', 'Button'));
    runCLI('add Table -y');
    const tableReactFiles = ['Table/Table.tsx', 'Table/Table.module.css'];
    for (const file of tableReactFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tableUtilsExist = await pathExists(
      path.join(TEST_DIR, 'src/components', 'Table', 'utils', 'virtualizer.ts'),
    );
    if (!tableUtilsExist) {
      throw new Error('Missing: Table/utils/virtualizer.ts');
    }
    results.push({ phase: 'Table + React + CSS', passed: true });

    // Table + React + SCSS
    console.log(ansis.cyan('📦 Phase 21: Table + React + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    const tableReactScssFiles = ['Table/Table.tsx', 'Table/Table.module.scss'];
    for (const file of tableReactScssFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    results.push({ phase: 'Table + React + SCSS', passed: true });

    // Table + React + Tailwind
    console.log(ansis.cyan('📦 Phase 22: Table + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    const tableReactTwFiles = ['Table/Table.tsx'];
    for (const file of tableReactTwFiles) {
      const filePath = path.join(TEST_DIR, 'src/components', file);
      if (!(await pathExists(filePath))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tableHasCssModule = await pathExists(
      path.join(TEST_DIR, 'src/components', 'Table', 'Table.module.css'),
    );
    if (tableHasCssModule) {
      throw new Error('React + Tailwind should not create CSS module for Table');
    }
    const tableComponentContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Table', 'Table.tsx'),
      'utf-8',
    );
    if (!tableComponentContent.includes('customVirtualState')) {
      throw new Error('Table missing customVirtualState prop');
    }
    results.push({ phase: 'Table + React + Tailwind', passed: true });

    // Table + Vue + CSS
    console.log(ansis.cyan('📦 Phase 23: Table + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    const tableVueFiles = ['Table/Table.vue'];
    for (const file of tableVueFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tableVueContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Table', 'Table.vue'),
      'utf-8',
    );
    if (!tableVueContent.includes('customVirtualState')) {
      throw new Error('Vue Table missing customVirtualState prop');
    }
    results.push({ phase: 'Table + Vue + CSS', passed: true });

    // Table + Vue + Tailwind
    console.log(ansis.cyan('📦 Phase 24: Table + Vue + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    const tableVueTwFiles = ['Table/Table.vue'];
    for (const file of tableVueTwFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tableVueTwContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Table', 'Table.vue'),
      'utf-8',
    );
    if (!tableVueTwContent.includes('customVirtualState')) {
      throw new Error('Vue Table missing customVirtualState prop');
    }
    results.push({ phase: 'Table + Vue + Tailwind', passed: true });

    // Table + Angular + CSS
    console.log(ansis.cyan('📦 Phase 25: Table + Angular + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    const tableAngularCssFiles = [
      'Table/table.component.ts',
      'Table/table.component.html',
      'Table/table.component.css',
    ];
    for (const file of tableAngularCssFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tableAngularCssContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Table', 'table.component.ts'),
      'utf-8',
    );
    if (!tableAngularCssContent.includes('customVirtualState')) {
      throw new Error('Angular Table missing customVirtualState input');
    }
    results.push({ phase: 'Table + Angular + CSS', passed: true });

    // Table + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 26: Table + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    const tableAngularScssFiles = [
      'Table/table.component.ts',
      'Table/table.component.html',
      'Table/table.component.scss',
    ];
    for (const file of tableAngularScssFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tableAngularScssContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Table', 'table.component.ts'),
      'utf-8',
    );
    if (!tableAngularScssContent.includes('customVirtualState')) {
      throw new Error('Angular Table missing customVirtualState input');
    }
    results.push({ phase: 'Table + Angular + SCSS', passed: true });

    // Table + Angular + Tailwind
    console.log(ansis.cyan('📦 Phase 27: Table + Angular + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Table'));
    runCLI('add Table -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Table', 'table.component.html')))) {
      throw new Error('Missing: Table/table.component.html');
    }
    const tableAngularTwContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Table', 'table.component.html'),
      'utf-8',
    );
    if (!tableAngularTwContent.includes('@if')) {
      throw new Error('Angular Tailwind Table should use modern control flow (@if)');
    }
    results.push({ phase: 'Table + Angular + Tailwind', passed: true });

    // ==================== POPOVER COMPONENT TESTS ====================
    console.log(ansis.cyan('\n🎈 POPOVER COMPONENT'));

    // Popover + React + CSS (Compound)
    console.log(ansis.cyan('📦 Phase 28: Popover + React + CSS (Compound)'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    runCLI('add Popover -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Popover', 'Popover.tsx')))) {
      throw new Error('Missing: Popover/Popover.tsx');
    }
    const popoverCompoundContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Popover', 'Popover.tsx'),
      'utf-8',
    );
    if (!popoverCompoundContent.includes('PopoverRoot')) {
      throw new Error('Popover missing compound component PopoverRoot');
    }
    results.push({ phase: 'Popover + React + CSS (Compound)', passed: true });

    // Popover + Vue + SCSS
    console.log(ansis.cyan('📦 Phase 29: Popover + Vue + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Popover'));
    runCLI('add Popover -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Popover', 'Popover.vue')))) {
      throw new Error('Missing: Popover/Popover.vue');
    }
    const popoverVueScssContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Popover', 'Popover.vue'),
      'utf-8',
    );
    if (!popoverVueScssContent.includes('lang="scss"')) {
      throw new Error('Vue Popover missing scss block');
    }
    results.push({ phase: 'Popover + Vue + SCSS', passed: true });

    // Popover + Vue + Tailwind
    console.log(ansis.cyan('📦 Phase 30: Popover + Vue + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Popover'));
    runCLI('add Popover -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Popover', 'Popover.vue')))) {
      throw new Error('Missing: Popover/Popover.vue');
    }
    const popoverVueTwContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Popover', 'Popover.vue'),
      'utf-8',
    );
    if (!popoverVueTwContent.includes('useFloating')) {
      throw new Error('Vue Popover missing useFloating logic');
    }
    results.push({ phase: 'Popover + Vue + Tailwind', passed: true });

    // Popover + Angular + CSS
    console.log(ansis.cyan('📦 Phase 31: Popover + Angular + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Popover'));
    runCLI('add Popover -y');
    const popoverAngularFiles = [
      'Popover/popover.component.ts',
      'Popover/popover.component.html',
      'Popover/popover.component.css',
    ];
    for (const file of popoverAngularFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const popoverAngularTsContent = await readFile(
      path.join(TEST_DIR, 'src/components', 'Popover', 'popover.component.ts'),
      'utf-8',
    );
    if (!popoverAngularTsContent.includes('computePosition')) {
      throw new Error('Angular Popover missing computePosition logic');
    }
    results.push({ phase: 'Popover + Angular + CSS', passed: true });

    // Toast + React + CSS
    console.log(ansis.cyan('📦 Phase 32: Toast + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Toast'));
    runCLI('add Toast -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.tsx')))) {
      throw new Error('Missing: Toast/Toast.tsx');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.module.css')))) {
      throw new Error('Missing: Toast/Toast.module.css');
    }
    const toastReactTsx = await readFile(
      path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.tsx'),
      'utf-8',
    );
    if (!toastReactTsx.includes('export const toast') || !toastReactTsx.includes('export function Toaster')) {
      throw new Error('React Toast missing Toaster + toast exports');
    }
    if (!toastReactTsx.includes('createPortal')) {
      throw new Error('React Toast missing createPortal');
    }
    results.push({ phase: 'Toast + React + CSS', passed: true });

    // Toast + Vue + SCSS
    console.log(ansis.cyan('📦 Phase 33: Toast + Vue + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Toast'));
    runCLI('add Toast -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.vue')))) {
      throw new Error('Missing: Toast/Toast.vue');
    }
    const toastVueScss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.vue'),
      'utf-8',
    );
    if (!toastVueScss.includes('lang="scss"')) {
      throw new Error('Vue Toast missing SCSS lang declaration');
    }
    if (!toastVueScss.includes('export const toast')) {
      throw new Error('Vue Toast missing toast named export');
    }
    results.push({ phase: 'Toast + Vue + SCSS', passed: true });

    // Toast + Vue + Tailwind
    console.log(ansis.cyan('📦 Phase 34: Toast + Vue + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Toast'));
    runCLI('add Toast -y');
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.vue')))) {
      throw new Error('Missing: Toast/Toast.vue');
    }
    const toastVueTailwind = await readFile(
      path.join(TEST_DIR, 'src/components', 'Toast', 'Toast.vue'),
      'utf-8',
    );
    if (!toastVueTailwind.includes('@keyframes toast-enter-bottom')) {
      throw new Error('Vue Tailwind Toast missing inline keyframes');
    }
    results.push({ phase: 'Toast + Vue + Tailwind', passed: true });

    // Toast + Angular + CSS
    console.log(ansis.cyan('📦 Phase 35: Toast + Angular + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: {
          focusRingStyle: 'outline',
          focusRingColor: 'var(--color-primary)',
          focusRingWidth: '2px',
          focusRingOffset: '2px',
          reduceMotion: true,
        },
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Toast'));
    runCLI('add Toast -y');
    const toastAngularFiles = [
      'Toast/toast.component.ts',
      'Toast/toast.component.html',
      'Toast/toast.component.css',
    ];
    for (const file of toastAngularFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const toastAngularTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Toast', 'toast.component.ts'),
      'utf-8',
    );
    if (!toastAngularTs.includes('toastsSignal') || !toastAngularTs.includes('export class ToasterComponent')) {
      throw new Error('Angular Toast missing signal store or ToasterComponent');
    }
    if (!toastAngularTs.includes('export const toast')) {
      throw new Error('Angular Toast missing toast named export');
    }
    results.push({ phase: 'Toast + Angular + CSS', passed: true });

    // ---- Form ----
    const formA11y = {
      focusRingStyle: 'outline',
      focusRingColor: 'var(--color-primary)',
      focusRingWidth: '2px',
      focusRingOffset: '2px',
      reduceMotion: true,
    };

    // Form + React + CSS (compound)
    console.log(ansis.cyan('📦 Phase 36: Form + React + CSS (compound)'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: formA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Form'));
    runCLI('add Form -y');
    const formReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Form', 'Form.tsx'),
      'utf-8',
    );
    if (!formReactCss.includes('export const FormControl') || !formReactCss.includes('Object.assign(FormRoot')) {
      throw new Error('React Form missing compound exports');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Form', 'Form.module.css')))) {
      throw new Error('Missing: Form/Form.module.css');
    }
    results.push({ phase: 'Form + React + CSS (compound)', passed: true });

    // Form + React + Tailwind
    console.log(ansis.cyan('📦 Phase 37: Form + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: formA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Form'));
    runCLI('add Form -y');
    const formReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Form', 'Form.tsx'),
      'utf-8',
    );
    if (!formReactTw.includes('gap-[var(--form-group-gap)]')) {
      throw new Error('React Tailwind Form missing inline token utility classes');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Form', 'Form.module.css'))) {
      throw new Error('Tailwind Form should not emit a CSS module');
    }
    results.push({ phase: 'Form + React + Tailwind', passed: true });

    // Form + Vue + CSS
    console.log(ansis.cyan('📦 Phase 38: Form + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: formA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Form'));
    runCLI('add Form -y');
    const formVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Form', 'Form.vue'),
      'utf-8',
    );
    if (!formVue.includes('export function useForm') || !formVue.includes('export const FormField')) {
      throw new Error('Vue Form missing useForm composable or FormField sub-component');
    }
    results.push({ phase: 'Form + Vue + CSS', passed: true });

    // Form + Angular + CSS
    console.log(ansis.cyan('📦 Phase 39: Form + Angular + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: formA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Form'));
    runCLI('add Form -y');
    const formNgFiles = ['Form/form.component.ts', 'Form/form.component.html', 'Form/form.component.scss'];
    for (const file of formNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const formNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Form', 'form.component.ts'),
      'utf-8',
    );
    if (!formNgTs.includes('export class FormComponent') || !formNgTs.includes("styleUrls: ['./form.component.scss']")) {
      throw new Error('Angular Form missing FormComponent or scss styleUrls');
    }
    results.push({ phase: 'Form + Angular + SCSS', passed: true });

    // ---- Tabs ----
    const tabsA11y = {
      focusRingStyle: 'outline',
      focusRingColor: 'var(--color-primary)',
      focusRingWidth: '2px',
      focusRingOffset: '2px',
      reduceMotion: true,
    };

    // Tabs + React + CSS (compound)
    console.log(ansis.cyan('📦 Phase 40: Tabs + React + CSS (compound)'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tabs'));
    runCLI('add Tabs -y');
    const tabsReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tabs', 'Tabs.tsx'),
      'utf-8',
    );
    if (!tabsReactCss.includes('export const TabsRoot') || !tabsReactCss.includes('Object.assign(TabsRoot')) {
      throw new Error('React Tabs missing compound exports');
    }
    if (!tabsReactCss.includes('role="tablist"') || !tabsReactCss.includes('role="tab"') || !tabsReactCss.includes('role="tabpanel"')) {
      throw new Error('React Tabs missing WAI-ARIA roles');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Tabs', 'Tabs.module.css')))) {
      throw new Error('Missing: Tabs/Tabs.module.css');
    }
    results.push({ phase: 'Tabs + React + CSS (compound)', passed: true });

    // Tabs + React + Tailwind
    console.log(ansis.cyan('📦 Phase 41: Tabs + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tabs'));
    runCLI('add Tabs -y');
    const tabsReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tabs', 'Tabs.tsx'),
      'utf-8',
    );
    if (!tabsReactTw.includes('data-[state=active]') || !tabsReactTw.includes('var(--tabs-')) {
      throw new Error('React Tailwind Tabs missing inline token utility classes');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Tabs', 'Tabs.module.css'))) {
      throw new Error('Tailwind Tabs should not emit a CSS module');
    }
    results.push({ phase: 'Tabs + React + Tailwind', passed: true });

    // Tabs + Vue + CSS
    console.log(ansis.cyan('📦 Phase 42: Tabs + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tabs'));
    runCLI('add Tabs -y');
    const tabsVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tabs', 'Tabs.vue'),
      'utf-8',
    );
    if (!tabsVue.includes('export const TabsList') || !tabsVue.includes('export const TabsTrigger') || !tabsVue.includes('export const TabsContent')) {
      throw new Error('Vue Tabs missing compound sub-component exports');
    }
    if (!tabsVue.includes("role: 'tablist'") || !tabsVue.includes("role: 'tab'") || !tabsVue.includes("role: 'tabpanel'")) {
      throw new Error('Vue Tabs missing WAI-ARIA roles');
    }
    results.push({ phase: 'Tabs + Vue + CSS', passed: true });

    // Tabs + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 43: Tabs + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tabs'));
    runCLI('add Tabs -y');
    const tabsNgFiles = ['Tabs/tabs.component.ts', 'Tabs/tabs.component.html', 'Tabs/tabs.component.scss'];
    for (const file of tabsNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tabsNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tabs', 'tabs.component.ts'),
      'utf-8',
    );
    if (!tabsNgTs.includes('export class TabsComponent') || !tabsNgTs.includes("styleUrls: ['./tabs.component.scss']")) {
      throw new Error('Angular Tabs missing TabsComponent or scss styleUrls');
    }
    const tabsNgHtml = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tabs', 'tabs.component.html'),
      'utf-8',
    );
    if (!tabsNgHtml.includes('role="tablist"') || !tabsNgHtml.includes('role="tab"') || !tabsNgHtml.includes('role="tabpanel"')) {
      throw new Error('Angular Tabs HTML missing WAI-ARIA roles');
    }
    results.push({ phase: 'Tabs + Angular + SCSS', passed: true });

    // Tooltip + React + CSS (compound)
    console.log(ansis.cyan('📦 Phase 44: Tooltip + React + CSS (compound)'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tooltip'));
    runCLI('add Tooltip -y');
    const tooltipReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tooltip', 'Tooltip.tsx'),
      'utf-8',
    );
    if (!tooltipReactCss.includes('export const TooltipRoot') || !tooltipReactCss.includes('Object.assign(TooltipRoot')) {
      throw new Error('React Tooltip missing compound exports');
    }
    if (!tooltipReactCss.includes("role: 'tooltip'")) {
      throw new Error('React Tooltip missing tooltip role');
    }
    if (tooltipReactCss.includes('FloatingFocusManager')) {
      throw new Error('React Tooltip should not trap focus');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Tooltip', 'Tooltip.module.css')))) {
      throw new Error('Missing: Tooltip/Tooltip.module.css');
    }
    results.push({ phase: 'Tooltip + React + CSS (compound)', passed: true });

    // Tooltip + React + Tailwind
    console.log(ansis.cyan('📦 Phase 45: Tooltip + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tooltip'));
    runCLI('add Tooltip -y');
    const tooltipReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tooltip', 'Tooltip.tsx'),
      'utf-8',
    );
    if (!tooltipReactTw.includes('data-[state=open]:animate-in') || !tooltipReactTw.includes('var(--tooltip-')) {
      throw new Error('React Tailwind Tooltip missing inline token utility classes');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Tooltip', 'Tooltip.module.css'))) {
      throw new Error('Tailwind Tooltip should not emit a CSS module');
    }
    results.push({ phase: 'Tooltip + React + Tailwind', passed: true });

    // Tooltip + Vue + CSS
    console.log(ansis.cyan('📦 Phase 46: Tooltip + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tooltip'));
    runCLI('add Tooltip -y');
    const tooltipVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tooltip', 'Tooltip.vue'),
      'utf-8',
    );
    if (!tooltipVue.includes('role="tooltip"') || !tooltipVue.includes('tooltip-content')) {
      throw new Error('Vue Tooltip missing tooltip role or content class');
    }
    results.push({ phase: 'Tooltip + Vue + CSS', passed: true });

    // Tooltip + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 47: Tooltip + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Tooltip'));
    runCLI('add Tooltip -y');
    const tooltipNgFiles = ['Tooltip/tooltip.component.ts', 'Tooltip/tooltip.component.html', 'Tooltip/tooltip.component.scss'];
    for (const file of tooltipNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const tooltipNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tooltip', 'tooltip.component.ts'),
      'utf-8',
    );
    if (!tooltipNgTs.includes('export class TooltipComponent') || !tooltipNgTs.includes("styleUrls: ['./tooltip.component.scss']")) {
      throw new Error('Angular Tooltip missing TooltipComponent or scss styleUrls');
    }
    const tooltipNgHtml = await readFile(
      path.join(TEST_DIR, 'src/components', 'Tooltip', 'tooltip.component.html'),
      'utf-8',
    );
    if (!tooltipNgHtml.includes('role="tooltip"')) {
      throw new Error('Angular Tooltip HTML missing tooltip role');
    }
    results.push({ phase: 'Tooltip + Angular + SCSS', passed: true });

    // Label + React + CSS
    console.log(ansis.cyan('📦 Phase 48: Label + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Label'));
    runCLI('add Label -y');
    const labelReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Label', 'Label.tsx'),
      'utf-8',
    );
    if (!labelReactCss.includes('export const Label') || !labelReactCss.includes('aria-hidden="true"')) {
      throw new Error('React Label missing export or required marker');
    }
    if (labelReactCss.includes('Object.assign')) {
      throw new Error('Label should be monolithic (no compound exports)');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Label', 'Label.module.css')))) {
      throw new Error('Missing: Label/Label.module.css');
    }
    results.push({ phase: 'Label + React + CSS', passed: true });

    // Label + React + Tailwind
    console.log(ansis.cyan('📦 Phase 49: Label + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Label'));
    runCLI('add Label -y');
    const labelReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Label', 'Label.tsx'),
      'utf-8',
    );
    if (!labelReactTw.includes('inline-flex items-center') || labelReactTw.includes('Label.module')) {
      throw new Error('React Tailwind Label missing inline utility classes or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Label', 'Label.module.css'))) {
      throw new Error('Tailwind Label should not emit a CSS module');
    }
    results.push({ phase: 'Label + React + Tailwind', passed: true });

    // Label + Vue + CSS
    console.log(ansis.cyan('📦 Phase 50: Label + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Label'));
    runCLI('add Label -y');
    const labelVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Label', 'Label.vue'),
      'utf-8',
    );
    if (!labelVue.includes('<label') || !labelVue.includes('aria-hidden="true"')) {
      throw new Error('Vue Label missing label element or required marker');
    }
    results.push({ phase: 'Label + Vue + CSS', passed: true });

    // Label + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 51: Label + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Label'));
    runCLI('add Label -y');
    const labelNgFiles = ['Label/label.component.ts', 'Label/label.component.html', 'Label/label.component.scss'];
    for (const file of labelNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const labelNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Label', 'label.component.ts'),
      'utf-8',
    );
    if (!labelNgTs.includes('export class LabelComponent') || !labelNgTs.includes("styleUrls: ['./label.component.scss']")) {
      throw new Error('Angular Label missing LabelComponent or scss styleUrls');
    }
    if (labelNgTs.includes('Object.assign')) {
      throw new Error('Angular Label should be monolithic');
    }
    const labelNgHtml = await readFile(
      path.join(TEST_DIR, 'src/components', 'Label', 'label.component.html'),
      'utf-8',
    );
    if (!labelNgHtml.includes('<ng-content></ng-content>')) {
      throw new Error('Angular Label HTML missing ng-content projection');
    }
    results.push({ phase: 'Label + Angular + SCSS', passed: true });

    // Separator + React + CSS
    console.log(ansis.cyan('📦 Phase 52: Separator + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Separator'));
    runCLI('add Separator -y');
    const sepReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Separator', 'Separator.tsx'),
      'utf-8',
    );
    if (!sepReactCss.includes('export const Separator') || !sepReactCss.includes("'separator'")) {
      throw new Error('React Separator missing export or separator role');
    }
    if (sepReactCss.includes('Object.assign')) {
      throw new Error('Separator should be monolithic');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Separator', 'Separator.module.css')))) {
      throw new Error('Missing: Separator/Separator.module.css');
    }
    results.push({ phase: 'Separator + React + CSS', passed: true });

    // Separator + React + Tailwind
    console.log(ansis.cyan('📦 Phase 53: Separator + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Separator'));
    runCLI('add Separator -y');
    const sepReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Separator', 'Separator.tsx'),
      'utf-8',
    );
    if (!sepReactTw.includes('bg-[var(--separator-color') || sepReactTw.includes('Separator.module')) {
      throw new Error('React Tailwind Separator missing inline classes or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Separator', 'Separator.module.css'))) {
      throw new Error('Tailwind Separator should not emit a CSS module');
    }
    results.push({ phase: 'Separator + React + Tailwind', passed: true });

    // Separator + Vue + CSS
    console.log(ansis.cyan('📦 Phase 54: Separator + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Separator'));
    runCLI('add Separator -y');
    const sepVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Separator', 'Separator.vue'),
      'utf-8',
    );
    if (!sepVue.includes('role="separator"') || !sepVue.includes('separator--labelled')) {
      throw new Error('Vue Separator missing separator role or labelled variant');
    }
    results.push({ phase: 'Separator + Vue + CSS', passed: true });

    // Separator + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 55: Separator + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Separator'));
    runCLI('add Separator -y');
    const sepNgFiles = ['Separator/separator.component.ts', 'Separator/separator.component.html', 'Separator/separator.component.scss'];
    for (const file of sepNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const sepNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Separator', 'separator.component.ts'),
      'utf-8',
    );
    if (!sepNgTs.includes('export class SeparatorComponent') || !sepNgTs.includes("styleUrls: ['./separator.component.scss']")) {
      throw new Error('Angular Separator missing SeparatorComponent or scss styleUrls');
    }
    results.push({ phase: 'Separator + Angular + SCSS', passed: true });

    // Badge + React + CSS
    console.log(ansis.cyan('📦 Phase 56: Badge + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Badge'));
    runCLI('add Badge -y');
    const badgeReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Badge', 'Badge.tsx'),
      'utf-8',
    );
    if (!badgeReactCss.includes('export const Badge') || badgeReactCss.includes('Object.assign')) {
      throw new Error('React Badge missing export or should be monolithic');
    }
    const badgeReactCssMod = await readFile(
      path.join(TEST_DIR, 'src/components', 'Badge', 'Badge.module.css'),
      'utf-8',
    );
    if (!badgeReactCssMod.includes('.badge--destructive') || !badgeReactCssMod.includes('.badge--outline')) {
      throw new Error('Badge CSS missing variant classes');
    }
    results.push({ phase: 'Badge + React + CSS', passed: true });

    // Badge + React + Tailwind
    console.log(ansis.cyan('📦 Phase 57: Badge + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Badge'));
    runCLI('add Badge -y');
    const badgeReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Badge', 'Badge.tsx'),
      'utf-8',
    );
    if (!badgeReactTw.includes('VARIANT_CLASSES') || !badgeReactTw.includes('bg-[var(--color-primary)]')) {
      throw new Error('React Tailwind Badge missing variant class map');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Badge', 'Badge.module.css'))) {
      throw new Error('Tailwind Badge should not emit a CSS module');
    }
    results.push({ phase: 'Badge + React + Tailwind', passed: true });

    // Badge + Vue + CSS
    console.log(ansis.cyan('📦 Phase 58: Badge + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Badge'));
    runCLI('add Badge -y');
    const badgeVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Badge', 'Badge.vue'),
      'utf-8',
    );
    if (!badgeVue.includes('class="badge') && !badgeVue.includes("'badge'")) {
      throw new Error('Vue Badge missing badge class binding');
    }
    results.push({ phase: 'Badge + Vue + CSS', passed: true });

    // Badge + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 59: Badge + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Badge'));
    runCLI('add Badge -y');
    const badgeNgFiles = ['Badge/badge.component.ts', 'Badge/badge.component.html', 'Badge/badge.component.scss'];
    for (const file of badgeNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const badgeNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Badge', 'badge.component.ts'),
      'utf-8',
    );
    if (!badgeNgTs.includes('export class BadgeComponent') || !badgeNgTs.includes("styleUrls: ['./badge.component.scss']")) {
      throw new Error('Angular Badge missing BadgeComponent or scss styleUrls');
    }
    results.push({ phase: 'Badge + Angular + SCSS', passed: true });

    // Skeleton + React + CSS
    console.log(ansis.cyan('📦 Phase 60: Skeleton + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Skeleton'));
    runCLI('add Skeleton -y');
    const skelReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Skeleton', 'Skeleton.tsx'),
      'utf-8',
    );
    if (!skelReactCss.includes('export const Skeleton') || !skelReactCss.includes('aria-busy="true"')) {
      throw new Error('React Skeleton missing export or aria-busy');
    }
    if (skelReactCss.includes('Object.assign')) {
      throw new Error('Skeleton should be monolithic');
    }
    const skelReactCssMod = await readFile(
      path.join(TEST_DIR, 'src/components', 'Skeleton', 'Skeleton.module.css'),
      'utf-8',
    );
    if (!skelReactCssMod.includes('@keyframes skeleton-pulse')) {
      throw new Error('Skeleton CSS missing pulse keyframes');
    }
    results.push({ phase: 'Skeleton + React + CSS', passed: true });

    // Skeleton + React + Tailwind
    console.log(ansis.cyan('📦 Phase 61: Skeleton + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Skeleton'));
    runCLI('add Skeleton -y');
    const skelReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Skeleton', 'Skeleton.tsx'),
      'utf-8',
    );
    if (!skelReactTw.includes('motion-safe:animate-pulse')) {
      throw new Error('React Tailwind Skeleton missing pulse animation class');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Skeleton', 'Skeleton.module.css'))) {
      throw new Error('Tailwind Skeleton should not emit a CSS module');
    }
    results.push({ phase: 'Skeleton + React + Tailwind', passed: true });

    // Skeleton + Vue + CSS
    console.log(ansis.cyan('📦 Phase 62: Skeleton + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Skeleton'));
    runCLI('add Skeleton -y');
    const skelVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Skeleton', 'Skeleton.vue'),
      'utf-8',
    );
    if (!skelVue.includes('aria-busy="true"') || !skelVue.includes('@keyframes skeleton-pulse')) {
      throw new Error('Vue Skeleton missing aria-busy or pulse keyframes');
    }
    results.push({ phase: 'Skeleton + Vue + CSS', passed: true });

    // Skeleton + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 63: Skeleton + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Skeleton'));
    runCLI('add Skeleton -y');
    const skelNgFiles = ['Skeleton/skeleton.component.ts', 'Skeleton/skeleton.component.html', 'Skeleton/skeleton.component.scss'];
    for (const file of skelNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const skelNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Skeleton', 'skeleton.component.ts'),
      'utf-8',
    );
    if (!skelNgTs.includes('export class SkeletonComponent') || !skelNgTs.includes("styleUrls: ['./skeleton.component.scss']")) {
      throw new Error('Angular Skeleton missing SkeletonComponent or scss styleUrls');
    }
    results.push({ phase: 'Skeleton + Angular + SCSS', passed: true });

    // Avatar + React + CSS
    console.log(ansis.cyan('📦 Phase 64: Avatar + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Avatar'));
    runCLI('add Avatar -y');
    const avReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Avatar', 'Avatar.tsx'),
      'utf-8',
    );
    if (!avReactCss.includes('export const Avatar') || !avReactCss.includes('role="img"') || !avReactCss.includes('onError')) {
      throw new Error('React Avatar missing export, img role, or onError fallback');
    }
    if (avReactCss.includes('Object.assign')) {
      throw new Error('Avatar should be monolithic');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Avatar', 'Avatar.module.css')))) {
      throw new Error('Missing: Avatar/Avatar.module.css');
    }
    results.push({ phase: 'Avatar + React + CSS', passed: true });

    // Avatar + React + Tailwind
    console.log(ansis.cyan('📦 Phase 65: Avatar + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Avatar'));
    runCLI('add Avatar -y');
    const avReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Avatar', 'Avatar.tsx'),
      'utf-8',
    );
    if (!avReactTw.includes('object-cover') || avReactTw.includes('Avatar.module')) {
      throw new Error('React Tailwind Avatar missing inline classes or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Avatar', 'Avatar.module.css'))) {
      throw new Error('Tailwind Avatar should not emit a CSS module');
    }
    results.push({ phase: 'Avatar + React + Tailwind', passed: true });

    // Avatar + Vue + CSS
    console.log(ansis.cyan('📦 Phase 66: Avatar + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Avatar'));
    runCLI('add Avatar -y');
    const avVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Avatar', 'Avatar.vue'),
      'utf-8',
    );
    if (!avVue.includes('role="img"') || !avVue.includes('@error')) {
      throw new Error('Vue Avatar missing img role or error fallback handler');
    }
    results.push({ phase: 'Avatar + Vue + CSS', passed: true });

    // Avatar + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 67: Avatar + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Avatar'));
    runCLI('add Avatar -y');
    const avNgFiles = ['Avatar/avatar.component.ts', 'Avatar/avatar.component.html', 'Avatar/avatar.component.scss'];
    for (const file of avNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const avNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Avatar', 'avatar.component.ts'),
      'utf-8',
    );
    if (!avNgTs.includes('export class AvatarComponent') || !avNgTs.includes("styleUrls: ['./avatar.component.scss']")) {
      throw new Error('Angular Avatar missing AvatarComponent or scss styleUrls');
    }
    const avNgHtml = await readFile(
      path.join(TEST_DIR, 'src/components', 'Avatar', 'avatar.component.html'),
      'utf-8',
    );
    if (!avNgHtml.includes('(error)="onError()"')) {
      throw new Error('Angular Avatar HTML missing image error fallback');
    }
    results.push({ phase: 'Avatar + Angular + SCSS', passed: true });

    // Textarea + React + CSS
    console.log(ansis.cyan('📦 Phase 68: Textarea + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Textarea'));
    runCLI('add Textarea -y');
    const taReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Textarea', 'Textarea.tsx'),
      'utf-8',
    );
    if (!taReactCss.includes('export const Textarea') || !taReactCss.includes('<textarea') || !taReactCss.includes('aria-invalid')) {
      throw new Error('React Textarea missing export, textarea element, or aria-invalid');
    }
    if (taReactCss.includes('Object.assign')) {
      throw new Error('Textarea should be monolithic');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Textarea', 'Textarea.module.css')))) {
      throw new Error('Missing: Textarea/Textarea.module.css');
    }
    results.push({ phase: 'Textarea + React + CSS', passed: true });

    // Textarea + React + Tailwind
    console.log(ansis.cyan('📦 Phase 69: Textarea + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Textarea'));
    runCLI('add Textarea -y');
    const taReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Textarea', 'Textarea.tsx'),
      'utf-8',
    );
    if (!taReactTw.includes('resize-y') || taReactTw.includes('Textarea.module')) {
      throw new Error('React Tailwind Textarea missing inline classes or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Textarea', 'Textarea.module.css'))) {
      throw new Error('Tailwind Textarea should not emit a CSS module');
    }
    results.push({ phase: 'Textarea + React + Tailwind', passed: true });

    // Textarea + Vue + CSS
    console.log(ansis.cyan('📦 Phase 70: Textarea + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Textarea'));
    runCLI('add Textarea -y');
    const taVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Textarea', 'Textarea.vue'),
      'utf-8',
    );
    if (!taVue.includes('<textarea') || !taVue.includes('update:modelValue')) {
      throw new Error('Vue Textarea missing textarea element or v-model wiring');
    }
    results.push({ phase: 'Textarea + Vue + CSS', passed: true });

    // Textarea + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 71: Textarea + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Textarea'));
    runCLI('add Textarea -y');
    const taNgFiles = ['Textarea/textarea.component.ts', 'Textarea/textarea.component.html', 'Textarea/textarea.component.scss'];
    for (const file of taNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const taNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Textarea', 'textarea.component.ts'),
      'utf-8',
    );
    if (!taNgTs.includes('export class TextareaComponent') || !taNgTs.includes("styleUrls: ['./textarea.component.scss']")) {
      throw new Error('Angular Textarea missing TextareaComponent or scss styleUrls');
    }
    results.push({ phase: 'Textarea + Angular + SCSS', passed: true });

    // Checkbox + React + CSS
    console.log(ansis.cyan('📦 Phase 72: Checkbox + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Checkbox'));
    runCLI('add Checkbox -y');
    const cbReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Checkbox', 'Checkbox.tsx'),
      'utf-8',
    );
    if (!cbReactCss.includes('export const Checkbox') || !cbReactCss.includes('type="checkbox"')) {
      throw new Error('React Checkbox missing export or checkbox input');
    }
    if (!cbReactCss.includes('.indeterminate = indeterminate')) {
      throw new Error('React Checkbox missing indeterminate ref effect');
    }
    if (cbReactCss.includes('Object.assign')) {
      throw new Error('Checkbox should be monolithic');
    }
    results.push({ phase: 'Checkbox + React + CSS', passed: true });

    // Checkbox + React + Tailwind
    console.log(ansis.cyan('📦 Phase 73: Checkbox + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Checkbox'));
    runCLI('add Checkbox -y');
    const cbReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Checkbox', 'Checkbox.tsx'),
      'utf-8',
    );
    if (!cbReactTw.includes('accent-[var(--color-primary)]') || cbReactTw.includes('Checkbox.module')) {
      throw new Error('React Tailwind Checkbox missing accent utility or still imports a CSS module');
    }
    results.push({ phase: 'Checkbox + React + Tailwind', passed: true });

    // Checkbox + Vue + CSS
    console.log(ansis.cyan('📦 Phase 74: Checkbox + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Checkbox'));
    runCLI('add Checkbox -y');
    const cbVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Checkbox', 'Checkbox.vue'),
      'utf-8',
    );
    if (!cbVue.includes('type="checkbox"') || !cbVue.includes('inputRef.value.indeterminate')) {
      throw new Error('Vue Checkbox missing checkbox input or indeterminate wiring');
    }
    results.push({ phase: 'Checkbox + Vue + CSS', passed: true });

    // Checkbox + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 75: Checkbox + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Checkbox'));
    runCLI('add Checkbox -y');
    const cbNgFiles = ['Checkbox/checkbox.component.ts', 'Checkbox/checkbox.component.html', 'Checkbox/checkbox.component.scss'];
    for (const file of cbNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const cbNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Checkbox', 'checkbox.component.ts'),
      'utf-8',
    );
    if (!cbNgTs.includes('export class CheckboxComponent') || !cbNgTs.includes("styleUrls: ['./checkbox.component.scss']")) {
      throw new Error('Angular Checkbox missing CheckboxComponent or scss styleUrls');
    }
    const cbNgHtml = await readFile(
      path.join(TEST_DIR, 'src/components', 'Checkbox', 'checkbox.component.html'),
      'utf-8',
    );
    if (!cbNgHtml.includes('[indeterminate]="indeterminate"')) {
      throw new Error('Angular Checkbox HTML missing indeterminate binding');
    }
    results.push({ phase: 'Checkbox + Angular + SCSS', passed: true });

    // Switch + React + CSS
    console.log(ansis.cyan('📦 Phase 76: Switch + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Switch'));
    runCLI('add Switch -y');
    const swReactCss = await readFile(
      path.join(TEST_DIR, 'src/components', 'Switch', 'Switch.tsx'),
      'utf-8',
    );
    if (!swReactCss.includes('export const Switch') || !swReactCss.includes('role="switch"') || !swReactCss.includes('aria-checked')) {
      throw new Error('React Switch missing export, switch role, or aria-checked');
    }
    if (swReactCss.includes('Object.assign')) {
      throw new Error('Switch should be monolithic');
    }
    results.push({ phase: 'Switch + React + CSS', passed: true });

    // Switch + React + Tailwind
    console.log(ansis.cyan('📦 Phase 77: Switch + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Switch'));
    runCLI('add Switch -y');
    const swReactTw = await readFile(
      path.join(TEST_DIR, 'src/components', 'Switch', 'Switch.tsx'),
      'utf-8',
    );
    if (!swReactTw.includes('role="switch"') || swReactTw.includes('Switch.module')) {
      throw new Error('React Tailwind Switch missing switch role or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Switch', 'Switch.module.css'))) {
      throw new Error('Tailwind Switch should not emit a CSS module');
    }
    results.push({ phase: 'Switch + React + Tailwind', passed: true });

    // Switch + Vue + CSS
    console.log(ansis.cyan('📦 Phase 78: Switch + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Switch'));
    runCLI('add Switch -y');
    const swVue = await readFile(
      path.join(TEST_DIR, 'src/components', 'Switch', 'Switch.vue'),
      'utf-8',
    );
    if (!swVue.includes('role="switch"') || !swVue.includes('update:modelValue')) {
      throw new Error('Vue Switch missing switch role or v-model wiring');
    }
    results.push({ phase: 'Switch + Vue + CSS', passed: true });

    // Switch + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 79: Switch + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Switch'));
    runCLI('add Switch -y');
    const swNgFiles = ['Switch/switch.component.ts', 'Switch/switch.component.html', 'Switch/switch.component.scss'];
    for (const file of swNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const swNgTs = await readFile(
      path.join(TEST_DIR, 'src/components', 'Switch', 'switch.component.ts'),
      'utf-8',
    );
    if (!swNgTs.includes('export class SwitchComponent') || !swNgTs.includes("styleUrls: ['./switch.component.scss']")) {
      throw new Error('Angular Switch missing SwitchComponent or scss styleUrls');
    }
    const swNgHtml = await readFile(
      path.join(TEST_DIR, 'src/components', 'Switch', 'switch.component.html'),
      'utf-8',
    );
    if (!swNgHtml.includes('role="switch"')) {
      throw new Error('Angular Switch HTML missing switch role');
    }
    results.push({ phase: 'Switch + Angular + SCSS', passed: true });

    // Alert + React + CSS
    console.log(ansis.cyan('📦 Phase 80: Alert + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Alert'));
    runCLI('add Alert -y');
    const alReactCss = await readFile(path.join(TEST_DIR, 'src/components', 'Alert', 'Alert.tsx'), 'utf-8');
    if (!alReactCss.includes('export const Alert') || !alReactCss.includes('role="alert"')) {
      throw new Error('React Alert missing export or alert role');
    }
    if (alReactCss.includes('Object.assign')) {
      throw new Error('Alert should be monolithic');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Alert', 'Alert.module.css')))) {
      throw new Error('Missing: Alert/Alert.module.css');
    }
    results.push({ phase: 'Alert + React + CSS', passed: true });

    // Alert + React + Tailwind
    console.log(ansis.cyan('📦 Phase 81: Alert + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Alert'));
    runCLI('add Alert -y');
    const alReactTw = await readFile(path.join(TEST_DIR, 'src/components', 'Alert', 'Alert.tsx'), 'utf-8');
    if (!alReactTw.includes('VARIANT_CLASSES') || alReactTw.includes('Alert.module')) {
      throw new Error('React Tailwind Alert missing variant map or still imports a CSS module');
    }
    results.push({ phase: 'Alert + React + Tailwind', passed: true });

    // Alert + Vue + CSS
    console.log(ansis.cyan('📦 Phase 82: Alert + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Alert'));
    runCLI('add Alert -y');
    const alVue = await readFile(path.join(TEST_DIR, 'src/components', 'Alert', 'Alert.vue'), 'utf-8');
    if (!alVue.includes('role="alert"')) {
      throw new Error('Vue Alert missing alert role');
    }
    results.push({ phase: 'Alert + Vue + CSS', passed: true });

    // Alert + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 83: Alert + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Alert'));
    runCLI('add Alert -y');
    const alNgFiles = ['Alert/alert.component.ts', 'Alert/alert.component.html', 'Alert/alert.component.scss'];
    for (const file of alNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const alNgTs = await readFile(path.join(TEST_DIR, 'src/components', 'Alert', 'alert.component.ts'), 'utf-8');
    if (!alNgTs.includes('export class AlertComponent') || !alNgTs.includes("styleUrls: ['./alert.component.scss']")) {
      throw new Error('Angular Alert missing AlertComponent or scss styleUrls');
    }
    results.push({ phase: 'Alert + Angular + SCSS', passed: true });

    // Progress + React + CSS
    console.log(ansis.cyan('📦 Phase 84: Progress + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Progress'));
    runCLI('add Progress -y');
    const prReactCss = await readFile(path.join(TEST_DIR, 'src/components', 'Progress', 'Progress.tsx'), 'utf-8');
    if (!prReactCss.includes('export const Progress') || !prReactCss.includes("role: 'progressbar'")) {
      throw new Error('React Progress missing export or progressbar role');
    }
    if (!prReactCss.includes("variant === 'circular'") || !prReactCss.includes('strokeDashoffset')) {
      throw new Error('React Progress missing circular variant');
    }
    if (prReactCss.includes('Object.assign')) {
      throw new Error('Progress should be monolithic');
    }
    results.push({ phase: 'Progress + React + CSS', passed: true });

    // Progress + React + Tailwind
    console.log(ansis.cyan('📦 Phase 85: Progress + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Progress'));
    runCLI('add Progress -y');
    const prReactTw = await readFile(path.join(TEST_DIR, 'src/components', 'Progress', 'Progress.tsx'), 'utf-8');
    if (!prReactTw.includes("role: 'progressbar'") || prReactTw.includes('Progress.module')) {
      throw new Error('React Tailwind Progress missing progressbar role or still imports a CSS module');
    }
    results.push({ phase: 'Progress + React + Tailwind', passed: true });

    // Progress + Vue + CSS
    console.log(ansis.cyan('📦 Phase 86: Progress + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Progress'));
    runCLI('add Progress -y');
    const prVue = await readFile(path.join(TEST_DIR, 'src/components', 'Progress', 'Progress.vue'), 'utf-8');
    if (!prVue.includes('role="progressbar"')) {
      throw new Error('Vue Progress missing progressbar role');
    }
    results.push({ phase: 'Progress + Vue + CSS', passed: true });

    // Progress + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 87: Progress + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Progress'));
    runCLI('add Progress -y');
    const prNgFiles = ['Progress/progress.component.ts', 'Progress/progress.component.html', 'Progress/progress.component.scss'];
    for (const file of prNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const prNgTs = await readFile(path.join(TEST_DIR, 'src/components', 'Progress', 'progress.component.ts'), 'utf-8');
    if (!prNgTs.includes('export class ProgressComponent') || !prNgTs.includes("styleUrls: ['./progress.component.scss']")) {
      throw new Error('Angular Progress missing ProgressComponent or scss styleUrls');
    }
    results.push({ phase: 'Progress + Angular + SCSS', passed: true });

    // Breadcrumb + React + CSS
    console.log(ansis.cyan('📦 Phase 88: Breadcrumb + React + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Breadcrumb'));
    runCLI('add Breadcrumb -y');
    const bcReactCss = await readFile(path.join(TEST_DIR, 'src/components', 'Breadcrumb', 'Breadcrumb.tsx'), 'utf-8');
    if (!bcReactCss.includes('export const Breadcrumb') || !bcReactCss.includes('aria-label="Breadcrumb"')) {
      throw new Error('React Breadcrumb missing export or nav aria-label');
    }
    if (bcReactCss.includes('Object.assign')) {
      throw new Error('Breadcrumb should be monolithic');
    }
    results.push({ phase: 'Breadcrumb + React + CSS', passed: true });

    // Breadcrumb + React + Tailwind
    console.log(ansis.cyan('📦 Phase 89: Breadcrumb + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Breadcrumb'));
    runCLI('add Breadcrumb -y');
    const bcReactTw = await readFile(path.join(TEST_DIR, 'src/components', 'Breadcrumb', 'Breadcrumb.tsx'), 'utf-8');
    if (!bcReactTw.includes('aria-label="Breadcrumb"') || bcReactTw.includes('Breadcrumb.module')) {
      throw new Error('React Tailwind Breadcrumb missing nav aria-label or still imports a CSS module');
    }
    results.push({ phase: 'Breadcrumb + React + Tailwind', passed: true });

    // Breadcrumb + Vue + CSS
    console.log(ansis.cyan('📦 Phase 90: Breadcrumb + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Breadcrumb'));
    runCLI('add Breadcrumb -y');
    const bcVue = await readFile(path.join(TEST_DIR, 'src/components', 'Breadcrumb', 'Breadcrumb.vue'), 'utf-8');
    if (!bcVue.includes('aria-label="Breadcrumb"') || !bcVue.includes('v-for')) {
      throw new Error('Vue Breadcrumb missing nav aria-label or item loop');
    }
    results.push({ phase: 'Breadcrumb + Vue + CSS', passed: true });

    // Breadcrumb + Angular + SCSS
    console.log(ansis.cyan('📦 Phase 91: Breadcrumb + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Breadcrumb'));
    runCLI('add Breadcrumb -y');
    const bcNgFiles = ['Breadcrumb/breadcrumb.component.ts', 'Breadcrumb/breadcrumb.component.html', 'Breadcrumb/breadcrumb.component.scss'];
    for (const file of bcNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const bcNgTs = await readFile(path.join(TEST_DIR, 'src/components', 'Breadcrumb', 'breadcrumb.component.ts'), 'utf-8');
    if (!bcNgTs.includes('export class BreadcrumbComponent') || !bcNgTs.includes("styleUrls: ['./breadcrumb.component.scss']")) {
      throw new Error('Angular Breadcrumb missing BreadcrumbComponent or scss styleUrls');
    }
    const bcNgHtml = await readFile(path.join(TEST_DIR, 'src/components', 'Breadcrumb', 'breadcrumb.component.html'), 'utf-8');
    if (!bcNgHtml.includes('aria-label="Breadcrumb"') || !bcNgHtml.includes('@for')) {
      throw new Error('Angular Breadcrumb HTML missing nav aria-label or @for loop');
    }
    results.push({ phase: 'Breadcrumb + Angular + SCSS', passed: true });

    // RadioGroup + React + CSS (compound)
    console.log(ansis.cyan('📦 Phase 92: RadioGroup + React + CSS (compound)'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'RadioGroup'));
    runCLI('add RadioGroup -y');
    const rgReactCss = await readFile(path.join(TEST_DIR, 'src/components', 'RadioGroup', 'RadioGroup.tsx'), 'utf-8');
    if (!rgReactCss.includes('export const RadioGroup') || !rgReactCss.includes('Object.assign(RadioGroupRoot')) {
      throw new Error('React RadioGroup missing compound exports');
    }
    if (!rgReactCss.includes('role="radiogroup"') || !rgReactCss.includes('role="radio"') || !rgReactCss.includes('aria-checked')) {
      throw new Error('React RadioGroup missing WAI-ARIA radiogroup roles');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'RadioGroup', 'RadioGroup.module.css')))) {
      throw new Error('Missing: RadioGroup/RadioGroup.module.css');
    }
    results.push({ phase: 'RadioGroup + React + CSS (compound)', passed: true });

    // RadioGroup + React + Tailwind
    console.log(ansis.cyan('📦 Phase 93: RadioGroup + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'RadioGroup'));
    runCLI('add RadioGroup -y');
    const rgReactTw = await readFile(path.join(TEST_DIR, 'src/components', 'RadioGroup', 'RadioGroup.tsx'), 'utf-8');
    if (!rgReactTw.includes('role="radiogroup"') || rgReactTw.includes('RadioGroup.module')) {
      throw new Error('React Tailwind RadioGroup missing radiogroup role or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'RadioGroup', 'RadioGroup.module.css'))) {
      throw new Error('Tailwind RadioGroup should not emit a CSS module');
    }
    results.push({ phase: 'RadioGroup + React + Tailwind', passed: true });

    // RadioGroup + Vue + CSS
    console.log(ansis.cyan('📦 Phase 94: RadioGroup + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'RadioGroup'));
    runCLI('add RadioGroup -y');
    const rgVue = await readFile(path.join(TEST_DIR, 'src/components', 'RadioGroup', 'RadioGroup.vue'), 'utf-8');
    if (!rgVue.includes("role: 'radiogroup'") && !rgVue.includes('role="radiogroup"')) {
      throw new Error('Vue RadioGroup missing radiogroup role');
    }
    results.push({ phase: 'RadioGroup + Vue + CSS', passed: true });

    // RadioGroup + Angular + SCSS (monolithic)
    console.log(ansis.cyan('📦 Phase 95: RadioGroup + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'RadioGroup'));
    runCLI('add RadioGroup -y');
    const rgNgFiles = ['RadioGroup/radiogroup.component.ts', 'RadioGroup/radiogroup.component.html', 'RadioGroup/radiogroup.component.scss'];
    for (const file of rgNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const rgNgTs = await readFile(path.join(TEST_DIR, 'src/components', 'RadioGroup', 'radiogroup.component.ts'), 'utf-8');
    if (!rgNgTs.includes('export class RadioGroupComponent') || !rgNgTs.includes("styleUrls: ['./radiogroup.component.scss']")) {
      throw new Error('Angular RadioGroup missing RadioGroupComponent or scss styleUrls');
    }
    if (rgNgTs.includes('Object.assign')) {
      throw new Error('Angular RadioGroup should be monolithic');
    }
    results.push({ phase: 'RadioGroup + Angular + SCSS', passed: true });

    // Accordion + React + CSS (compound)
    console.log(ansis.cyan('📦 Phase 96: Accordion + React + CSS (compound)'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Accordion'));
    runCLI('add Accordion -y');
    const acReactCss = await readFile(path.join(TEST_DIR, 'src/components', 'Accordion', 'Accordion.tsx'), 'utf-8');
    if (!acReactCss.includes('export const Accordion') || !acReactCss.includes('Object.assign(AccordionRoot')) {
      throw new Error('React Accordion missing compound exports');
    }
    if (!acReactCss.includes('aria-expanded') || !acReactCss.includes('role="region"')) {
      throw new Error('React Accordion missing disclosure a11y wiring');
    }
    if (!(await pathExists(path.join(TEST_DIR, 'src/components', 'Accordion', 'Accordion.module.css')))) {
      throw new Error('Missing: Accordion/Accordion.module.css');
    }
    results.push({ phase: 'Accordion + React + CSS (compound)', passed: true });

    // Accordion + React + Tailwind
    console.log(ansis.cyan('📦 Phase 97: Accordion + React + Tailwind'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'react',
        styleSystem: 'tailwind',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Accordion'));
    runCLI('add Accordion -y');
    const acReactTw = await readFile(path.join(TEST_DIR, 'src/components', 'Accordion', 'Accordion.tsx'), 'utf-8');
    if (!acReactTw.includes('aria-expanded') || acReactTw.includes('Accordion.module')) {
      throw new Error('React Tailwind Accordion missing aria-expanded or still imports a CSS module');
    }
    if (await pathExists(path.join(TEST_DIR, 'src/components', 'Accordion', 'Accordion.module.css'))) {
      throw new Error('Tailwind Accordion should not emit a CSS module');
    }
    results.push({ phase: 'Accordion + React + Tailwind', passed: true });

    // Accordion + Vue + CSS
    console.log(ansis.cyan('📦 Phase 98: Accordion + Vue + CSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'vue',
        styleSystem: 'css',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Accordion'));
    runCLI('add Accordion -y');
    const acVue = await readFile(path.join(TEST_DIR, 'src/components', 'Accordion', 'Accordion.vue'), 'utf-8');
    if (!acVue.includes('aria-expanded')) {
      throw new Error('Vue Accordion missing aria-expanded');
    }
    results.push({ phase: 'Accordion + Vue + CSS', passed: true });

    // Accordion + Angular + SCSS (monolithic)
    console.log(ansis.cyan('📦 Phase 99: Accordion + Angular + SCSS'));
    await writeJson(
      path.join(TEST_DIR, 'crucible.config.json'),
      {
        version: '1.0.0',
        framework: 'angular',
        styleSystem: 'scss',
        theme: 'minimal',
        features: { hover: true, focusRing: true, motionSafe: true },
        a11y: tabsA11y,
      },
      { spaces: 2 },
    );
    await remove(path.join(TEST_DIR, 'src/components', 'Accordion'));
    runCLI('add Accordion -y');
    const acNgFiles = ['Accordion/accordion.component.ts', 'Accordion/accordion.component.html', 'Accordion/accordion.component.scss'];
    for (const file of acNgFiles) {
      if (!(await pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    const acNgTs = await readFile(path.join(TEST_DIR, 'src/components', 'Accordion', 'accordion.component.ts'), 'utf-8');
    if (!acNgTs.includes('export class AccordionComponent') || !acNgTs.includes("styleUrls: ['./accordion.component.scss']")) {
      throw new Error('Angular Accordion missing AccordionComponent or scss styleUrls');
    }
    if (acNgTs.includes('Object.assign')) {
      throw new Error('Angular Accordion should be monolithic');
    }
    const acNgHtml = await readFile(path.join(TEST_DIR, 'src/components', 'Accordion', 'accordion.component.html'), 'utf-8');
    if (!acNgHtml.includes('aria-expanded')) {
      throw new Error('Angular Accordion HTML missing aria-expanded');
    }
    results.push({ phase: 'Accordion + Angular + SCSS', passed: true });
  } catch (error: any) {
    console.error(ansis.red(`\n❌ Test Failed: ${error.message}`));
    results.push({ phase: 'FAILED', passed: false, error: error.message });
    process.exitCode = 1;
  } finally {
    console.log(ansis.gray('\n🧹 Cleaning up...'));
    await remove(TEST_DIR);
  }

  console.log(ansis.bold('\n📊 Test Results Summary:\n'));
  let passed = 0;
  let failed = 0;
  for (const result of results) {
    if (result.passed) {
      console.log(ansis.green(`  ✓ ${result.phase}`));
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
