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
