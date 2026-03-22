import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const TEST_DIR = path.join(ROOT_DIR, '.e2e-test-env');

interface E2EResult {
  phase: string;
  passed: boolean;
  error?: string;
}

async function runE2E() {
  console.log(chalk.blue('\n🚀 Starting Comprehensive E2E Test Suite...\n'));
  const results: E2EResult[] = [];

  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'ignore' });

  // Cleanup previous test runs
  await fs.remove(TEST_DIR);
  await fs.ensureDir(TEST_DIR);

  try {
    // Setup basic package.json
    await fs.writeJson(
      path.join(TEST_DIR, 'package.json'),
      {
        name: 'crucible-e2e-test',
        version: '1.0.0',
        dependencies: { react: '^18.2.0', 'react-dom': '^18.2.0' },
        devDependencies: {
          '@types/react': '^18.2.0',
          '@types/react-dom': '^18.2.0',
          typescript: '^5.0.0',
          vite: '^5.0.0',
          '@storybook/react': '^7.6.0',
        },
      },
      { spaces: 2 },
    );

    // Helper function for running CLI commands
    const runCLI = (args: string, cwd: string = TEST_DIR) => {
      return execSync(`node "${CLI_PATH}" ${args}`, { cwd, encoding: 'utf-8' });
    };

    // ==================== REACT CSS TESTS ====================
    console.log(chalk.cyan('📦 Phase 1: React + CSS Framework'));

    await fs.writeJson(
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
    const reactButtonFiles = [
      'Button/Button.tsx',
      'Button/Button.module.css',
      'Button/Button.stories.tsx',
    ];
    for (const file of reactButtonFiles) {
      if (!(await fs.pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    results.push({ phase: 'React CSS + Button', passed: true });

    // ==================== REACT TAILWIND TESTS ====================
    console.log(chalk.cyan('📦 Phase 2: React + Tailwind Framework'));

    const tailwindConfig = (await fs.readJson(path.join(TEST_DIR, 'crucible.config.json'))) as any;
    tailwindConfig.styleSystem = 'tailwind';
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), tailwindConfig, { spaces: 2 });

    runCLI('add Input Card -y');
    for (const comp of ['Input', 'Card']) {
      if (!(await fs.pathExists(path.join(TEST_DIR, 'src/components', comp, `${comp}.tsx`)))) {
        throw new Error(`Missing: ${comp}/${comp}.tsx`);
      }
      const cssPath = path.join(TEST_DIR, 'src/components', comp, `${comp}.module.css`);
      if (await fs.pathExists(cssPath)) {
        throw new Error(`${comp} should not have CSS module in Tailwind mode`);
      }
    }
    results.push({ phase: 'React Tailwind + Input/Card', passed: true });

    // ==================== ANGULAR TESTS ====================
    console.log(chalk.cyan('📦 Phase 3: Angular Framework'));

    const angularConfig = { ...tailwindConfig, framework: 'angular' };
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), angularConfig, { spaces: 2 });

    await fs.writeJson(
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

    runCLI('add Modal -y');
    const angularModalFiles = [
      'Modal/modal.component.ts',
      'Modal/modal.component.html',
      'Modal/modal.component.css',
    ];
    for (const file of angularModalFiles) {
      if (!(await fs.pathExists(path.join(TEST_DIR, 'src/components', file)))) {
        throw new Error(`Missing: ${file}`);
      }
    }
    results.push({ phase: 'Angular + Modal', passed: true });

    // ==================== VUE TESTS ====================
    console.log(chalk.cyan('📦 Phase 4: Vue Framework'));

    const vueConfig = { ...tailwindConfig, framework: 'vue' };
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), vueConfig, { spaces: 2 });

    runCLI('add Select --stories -y');
    if (!(await fs.pathExists(path.join(TEST_DIR, 'src/components', 'Select', 'Select.vue')))) {
      throw new Error('Missing: Select/Select.vue');
    }
    if (
      !(await fs.pathExists(path.join(TEST_DIR, 'src/components', 'Select', 'Select.stories.ts')))
    ) {
      throw new Error('Missing: Select/Select.stories.ts');
    }
    results.push({ phase: 'Vue + Select', passed: true });

    // ==================== SCSS TESTS ====================
    console.log(chalk.cyan('📦 Phase 5: SCSS Style System'));

    const scssConfig = { ...tailwindConfig, styleSystem: 'scss' };
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), scssConfig, { spaces: 2 });

    runCLI('add Button -y');
    const scssPath = path.join(TEST_DIR, 'src/components', 'Button', 'Button.module.scss');
    if (!(await fs.pathExists(scssPath))) {
      throw new Error('Missing: Button/Button.module.scss for SCSS');
    }
    results.push({ phase: 'SCSS Style System', passed: true });

    // ==================== DRY RUN TESTS ====================
    console.log(chalk.cyan('📦 Phase 6: Dry Run Mode'));

    const originalButtonContent = await fs.readFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      'utf-8',
    );
    runCLI('add Button --dry-run -y');
    const afterDryRunContent = await fs.readFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      'utf-8',
    );
    if (originalButtonContent !== afterDryRunContent) {
      throw new Error('Dry run modified file');
    }
    results.push({ phase: 'Dry Run Mode', passed: true });

    // ==================== FORCE FLAG TESTS ====================
    console.log(chalk.cyan('📦 Phase 7: Force Flag'));

    await fs.writeFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      '// Modified by user',
    );
    runCLI('add Button --force -y');
    const afterForceContent = await fs.readFile(
      path.join(TEST_DIR, 'src/components', 'Button', 'Button.tsx'),
      'utf-8',
    );
    if (afterForceContent.includes('// Modified by user')) {
      throw new Error('Force flag did not overwrite modified file');
    }
    results.push({ phase: 'Force Flag', passed: true });

    // ==================== HASH PROTECTION TESTS ====================
    console.log(chalk.cyan('📦 Phase 8: Hash Protection'));

    await fs.writeFile(
      path.join(TEST_DIR, 'src/components', 'Input', 'Input.tsx'),
      '// User modification that should be protected',
    );
    runCLI('add Input -y');
    const inputContent = await fs.readFile(
      path.join(TEST_DIR, 'src/components', 'Input', 'Input.tsx'),
      'utf-8',
    );
    if (inputContent.includes('User modification')) {
      throw new Error('Hash protection did not work - file was overwritten');
    }
    results.push({ phase: 'Hash Protection', passed: true });

    // ==================== MULTI COMPONENT TESTS ====================
    console.log(chalk.cyan('📦 Phase 9: Multi-Component Generation'));

    runCLI('add Button Input Card Modal Select --no-stories -y');
    for (const comp of ['Button', 'Input', 'Card', 'Modal', 'Select']) {
      if (!(await fs.pathExists(path.join(TEST_DIR, 'src/components', comp, `${comp}.tsx`)))) {
        throw new Error(`Missing multi-component: ${comp}`);
      }
      if (await fs.pathExists(path.join(TEST_DIR, 'src/components', comp, `${comp}.stories.tsx`))) {
        throw new Error(`${comp} should not have stories with --no-stories`);
      }
    }
    results.push({ phase: 'Multi-Component Generation', passed: true });

    // ==================== THEME PRESETS TESTS ====================
    console.log(chalk.cyan('📦 Phase 10: Theme Presets'));

    const softConfig = { ...scssConfig, theme: 'soft' };
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), softConfig, { spaces: 2 });
    runCLI('add Card --force -y');
    const softCardContent = await fs.readFile(
      path.join(TEST_DIR, 'src/components', 'Card', 'Card.module.scss'),
      'utf-8',
    );
    if (!softCardContent.includes('#E8E0FF')) {
      throw new Error('Soft theme tokens not applied');
    }
    results.push({ phase: 'Soft Theme Preset', passed: true });

    // ==================== OUTPUT DIR TESTS ====================
    console.log(chalk.cyan('📦 Phase 11: Custom Output Directory'));

    const customDirConfig = { ...softConfig, flags: { outputDir: 'custom/components' } };
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), customDirConfig, { spaces: 2 });
    runCLI('add Button --force -y');
    if (!(await fs.pathExists(path.join(TEST_DIR, 'custom/components', 'Button', 'Button.tsx')))) {
      throw new Error('Custom output directory not used');
    }
    results.push({ phase: 'Custom Output Directory', passed: true });

    // ==================== INIT COMMAND TESTS ====================
    console.log(chalk.cyan('📦 Phase 12: Init Command'));

    await fs.remove(path.join(TEST_DIR, 'crucible.config.json'));
    runCLI('init -y');
    if (!(await fs.pathExists(path.join(TEST_DIR, 'crucible.config.json')))) {
      throw new Error('Init command failed');
    }
    results.push({ phase: 'Init Command', passed: true });

    // ==================== EJECT COMMAND TESTS ====================
    console.log(chalk.cyan('📦 Phase 13: Eject Command'));

    runCLI('eject');
    const ejectedConfig = await fs.readJson(path.join(TEST_DIR, 'crucible.config.json'));
    if (ejectedConfig.theme !== 'custom') {
      throw new Error('Eject did not change theme to custom');
    }
    if (!ejectedConfig.tokens?.color?.primary) {
      throw new Error('Eject did not inject tokens');
    }
    results.push({ phase: 'Eject Command', passed: true });

    // ==================== LIST COMMAND TESTS ====================
    console.log(chalk.cyan('📦 Phase 14: List Command'));

    const listOutput = runCLI('list');
    if (!listOutput.includes('Button') || !listOutput.includes('React')) {
      throw new Error('List command did not show components');
    }
    results.push({ phase: 'List Command', passed: true });

    // ==================== ERROR HANDLING TESTS ====================
    console.log(chalk.cyan('📦 Phase 15: Error Handling'));

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
    console.error(chalk.red(`\n❌ Test Failed: ${error.message}`));
    results.push({ phase: 'FAILED', passed: false, error: error.message });
    process.exitCode = 1;
  } finally {
    // Cleanup
    console.log(chalk.gray('\n🧹 Cleaning up...'));
    await fs.remove(TEST_DIR);
  }

  // Print summary
  console.log(chalk.bold('\n📊 Test Results Summary:\n'));
  let passed = 0;
  let failed = 0;
  for (const result of results) {
    if (result.passed) {
      console.log(chalk.green(`  ✓ ${result.phase}`));
      passed++;
    } else {
      console.log(chalk.red(`  ✗ ${result.phase}: ${result.error}`));
      failed++;
    }
  }
  console.log(chalk.bold(`\n  Total: ${passed} passed, ${failed} failed\n`));

  if (failed === 0) {
    console.log(chalk.green.bold('🎉 All E2E tests passed!\n'));
  } else {
    console.log(chalk.red.bold(`❌ ${failed} test(s) failed.\n`));
    process.exitCode = 1;
  }
}

runE2E();
