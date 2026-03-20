import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const TEST_DIR = path.join(ROOT_DIR, '.e2e-test-env');

async function runE2E() {
  console.log(chalk.blue('🚀 Starting Comprehensive E2E "Prod-Like" Test...'));

  // Ensure fresh build of CLI
  console.log(chalk.gray('-> Building Crucible CLI...'));
  execSync('npm run build', { cwd: ROOT_DIR, stdio: 'inherit' });

  // 1. Setup Test Environment
  console.log(chalk.gray('-> Cleaning up old test environment...'));
  await fs.remove(TEST_DIR);
  await fs.ensureDir(TEST_DIR);

  try {
    // Phase A: Setup & Init
    console.log(chalk.gray('-> [Phase A] Simulating a user project...'));
    await fs.writeJson(
      path.join(TEST_DIR, 'package.json'),
      {
        name: 'crucible-e2e-test',
        version: '1.0.0',
        dependencies: {
          react: '^18.2.0',
          'react-dom': '^18.2.0',
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "typescript": "^5.0.0",
          "vite": "^5.0.0", // Needed to test Vite-aware Tailwind setup
          "@storybook/react": "^7.6.0"
        }
      },
      { spaces: 2 },
    );

    await fs.writeJson(
      path.join(TEST_DIR, 'tsconfig.json'),
      {
        compilerOptions: {
          target: 'ESNext',
          jsx: 'react-jsx',
          moduleResolution: 'Node',
          strict: true,
          esModuleInterop: true,
          skipLibCheck: true,
        },
        include: ['src'],
      },
      { spaces: 2 },
    );

    console.log(chalk.gray('-> [Phase A] Running crucible init...'));
    execSync(`node "${CLI_PATH}" init -y`, { cwd: TEST_DIR, stdio: 'inherit' });

    if (!(await fs.pathExists(path.join(TEST_DIR, 'crucible.config.json')))) {
      throw new Error('crucible init failed to create config.');
    }

    // Phase B: Eject Command
    console.log(chalk.gray('-> [Phase B] Running crucible eject...'));
    execSync(`node "${CLI_PATH}" eject`, { cwd: TEST_DIR, stdio: 'inherit' });
    const config = await fs.readJson(path.join(TEST_DIR, 'crucible.config.json'));
    if (config.theme !== 'custom' || !config.tokens.color.primary) {
      throw new Error('Eject command failed to update config correctly.');
    }

    // Phase C: Tailwind Auto-Setup Flow
    console.log(chalk.gray('-> [Phase C] Testing Tailwind setup flow...'));
    config.styleSystem = 'tailwind';
    await fs.writeJson(path.join(TEST_DIR, 'crucible.config.json'), config, { spaces: 2 });

    execSync(`node "${CLI_PATH}" add Button -y`, { cwd: TEST_DIR, stdio: 'inherit' });
    if (!(await fs.pathExists(path.join(TEST_DIR, 'src/index.css')))) {
      throw new Error('Tailwind setup failed to create src/index.css');
    }
    const cssContent = await fs.readFile(path.join(TEST_DIR, 'src/index.css'), 'utf-8');
    if (!cssContent.includes('@import "tailwindcss"')) {
      throw new Error('Tailwind setup failed to inject @import');
    }

    const pkg = await fs.readJson(path.join(TEST_DIR, 'package.json'));
    if (!pkg.dependencies?.tailwindcss && !pkg.devDependencies?.tailwindcss) {
      throw new Error('Tailwind setup failed to install tailwindcss');
    }

    // Phase D: Full Component Scaffolding
    console.log(chalk.gray('-> [Phase D] Scaffolding remaining components...'));
    // Select should also trigger Button if it wasn't there, but Button is there now.
    // Testing --stories and --no-stories flags here
    execSync(`node "${CLI_PATH}" add Select --stories -y`, {
      cwd: TEST_DIR,
      stdio: 'inherit',
    });
    execSync(`node "${CLI_PATH}" add Input Card Modal --no-stories -y`, {
      cwd: TEST_DIR,
      stdio: 'inherit',
    });

    console.log(chalk.gray('-> Verifying file system output...'));
    const componentsDir = path.join(TEST_DIR, 'src/components');
    const expectedSubfolders = [
      'Button',
      'Input',
      'Select',
      'Card',
      'Modal',
    ];

    for (const folder of expectedSubfolders) {
      if (!(await fs.pathExists(path.join(componentsDir, folder)))) {
        throw new Error(`Expected generated component subfolder missing: ${folder}`);
      }
      if (!(await fs.pathExists(path.join(componentsDir, folder, `${folder}.tsx`)))) {
        throw new Error(`Expected generated component file missing: ${folder}/${folder}.tsx`);
      }
    }

    // Verify stories logic
    if (!(await fs.pathExists(path.join(componentsDir, 'Select/Select.stories.tsx')))) {
      throw new Error('Expected Select.stories.tsx to exist with --stories flag.');
    }
    if (await fs.pathExists(path.join(componentsDir, 'Input/Input.stories.tsx'))) {
      throw new Error('Expected Input.stories.tsx to be missing with --no-stories flag.');
    }

    // Verify config default stories: false (implicit default)
    if (await fs.pathExists(path.join(componentsDir, 'Button/Button.stories.tsx'))) {
      throw new Error('Expected Button.stories.tsx to be missing by default.');
    }

    // Phase E: Compilation & Stability Check
    console.log(chalk.gray('-> [Phase E] Installing mock project dependencies...'));
    execSync('npm install --no-audit --no-fund', { cwd: TEST_DIR, stdio: 'ignore' });

    console.log(chalk.gray('-> [Phase E] Running TypeScript compiler on generated code...'));
    execSync('npx tsc --noEmit', { cwd: TEST_DIR, stdio: 'inherit' });
    console.log(chalk.green('   ✔ Generated components passed strict TypeScript compilation!'));

    console.log(
      chalk.green.bold(
        '\n🎉 E2E Test Passed: The system works perfectly in a simulated production environment.',
      ),
    );
  } catch (error: any) {
    console.error(chalk.red.bold('\n❌ E2E Test Failed!'));
    console.error(error.message || error);
    process.exitCode = 1;
  } finally {
    // Phase F: Mandatory Cleanup
    console.log(chalk.gray('-> [Phase F] Mandatory cleanup...'));
    await fs.remove(TEST_DIR);
  }
}

runE2E();
