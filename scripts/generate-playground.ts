import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const FRAMEWORKS = ['react', 'angular', 'vue'] as const;
const COMPONENTS = ['Button', 'Input', 'Card', 'Dialog', 'Select'];
const STORYBOOK_PORTS: Record<string, number> = {
  react: 6006,
  angular: 6007,
  vue: 6008,
};

type Framework = (typeof FRAMEWORKS)[number];

interface GenerateOptions {
  framework?: Framework | 'all';
  styleSystem?: 'css' | 'tailwind' | 'scss';
  stories?: boolean;
  force?: boolean;
}

function getPlaygroundPath(framework: Framework): string {
  return path.join(ROOT_DIR, 'playground', framework);
}

function getConfigPath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), 'crucible.config.json');
}

function getGeneratedPath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), 'src', '__generated__');
}

function getPublicGeneratedPath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), 'public', '__generated__');
}

function getCruciblePath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), '.crucible');
}

function isGenerated(framework: Framework): boolean {
  const genPath = getGeneratedPath(framework);
  return fs.existsSync(genPath) && fs.readdirSync(genPath).length > 0;
}

async function cleanupPlayground(framework: Framework): Promise<void> {
  const pgPath = getPlaygroundPath(framework);
  const pathsToDelete = [
    getConfigPath(framework),
    getGeneratedPath(framework),
    getPublicGeneratedPath(framework),
    getCruciblePath(framework),
  ];

  console.log(chalk.gray(`  Cleaning up existing files...`));
  for (const p of pathsToDelete) {
    if (fs.existsSync(p)) {
      await fs.remove(p);
      console.log(chalk.gray(`    Removed: ${path.relative(pgPath, p)}`));
    }
  }
}

async function createConfig(framework: Framework): Promise<void> {
  const configPath = getConfigPath(framework);
  const config: Record<string, unknown> = {
    version: '1',
    framework,
    styleSystem: 'css',
    theme: 'minimal',
    tokens: {
      color: {
        primary: '#6C63FF',
        secondary: '#F3F2FF',
        surface: '#FFFFFF',
        background: '#F8F9FA',
        border: '#E2E1F0',
        text: '#1A1A2E',
        textMuted: '#6B6B8A',
        destructive: '#E24B4A',
        success: '#1D9E75',
      },
      radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      spacing: {
        unit: '4px',
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        scaleBase: '16px',
      },
    },
    features: {
      hover: true,
      focusRing: true,
      motionSafe: true,
      compoundComponents: true,
    },
    a11y: {
      focusRingStyle: 'outline',
      focusRingColor: 'var(--color-primary)',
      focusRingWidth: '2px',
      focusRingOffset: '3px',
      reduceMotion: true,
    },
    flags: {
      outputDir: 'src/__generated__',
      stories: true,
    },
  };

  await fs.writeJson(configPath, config, { spaces: 2 });
  console.log(chalk.gray(`  Created ${framework}/crucible.config.json`));
}

async function installDependencies(framework: Framework): Promise<void> {
  const playgroundPath = getPlaygroundPath(framework);
  console.log(chalk.gray(`  Installing dependencies for ${framework}...`));

  try {
    execSync('npm install', {
      cwd: playgroundPath,
      stdio: 'inherit',
    });
    console.log(chalk.gray(`  Dependencies installed`));
  } catch (error: any) {
    console.log(chalk.yellow(`  Warning: Some dependencies may not have installed correctly`));
  }
}

async function generateFramework(
  framework: Framework,
  options: GenerateOptions,
): Promise<{ success: boolean; error?: string }> {
  const playgroundPath = getPlaygroundPath(framework);

  console.log(chalk.cyan(`\n📦 Generating ${framework} playground...`));

  try {
    if (options.force) {
      await cleanupPlayground(framework);
    }

    await fs.ensureDir(path.join(playgroundPath, 'src'));
    await createConfig(framework);
    await installDependencies(framework);

    const shouldGenerate = options.force || !isGenerated(framework);

    if (shouldGenerate) {
      const componentsArg = COMPONENTS.join(' ');
      const flags = options.stories ? '--stories -y --dev' : '-y --dev';

      console.log(chalk.gray(`  Running: crucible add ${componentsArg} ${flags}`));

      execSync(`node "${CLI_PATH}" add ${componentsArg} ${flags}`, {
        cwd: playgroundPath,
        stdio: 'inherit',
      });
    } else {
      console.log(chalk.gray(`  Components already generated, skipping...`));
    }

    const generatedCount = fs.existsSync(getGeneratedPath(framework))
      ? fs.readdirSync(getGeneratedPath(framework)).length
      : 0;
    console.log(chalk.green(`  ✓ ${framework}: ${generatedCount} components ready`));

    return { success: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.log(chalk.red(`  ✗ ${framework}: ${errorMsg}`));
    return { success: false, error: errorMsg };
  }
}

export async function generatePlayground(options: GenerateOptions = {}): Promise<void> {
  const framework = options.framework || 'all';
  const frameworks = framework === 'all' ? [...FRAMEWORKS] : [framework as Framework];

  console.log(chalk.blue('\n🚀 Crucible Playground Generator\n'));
  console.log(chalk.gray(`CLI: ${CLI_PATH}`));
  console.log(chalk.gray(`Frameworks: ${frameworks.join(', ')}`));
  console.log(chalk.gray(`Stories: ${options.stories !== false}`));
  console.log(chalk.gray(`Force: ${options.force || false}`));

  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const fw of frameworks) {
    results[fw] = await generateFramework(fw, options);
  }

  console.log(chalk.blue('\n📊 Summary:\n'));
  let allSuccess = true;
  for (const [fw, result] of Object.entries(results)) {
    if (result.success) {
      console.log(chalk.green(`  ✓ ${fw}`));
    } else {
      console.log(chalk.red(`  ✗ ${fw}: ${result.error}`));
      allSuccess = false;
    }
  }

  console.log(chalk.blue('\n🎉 Playground generation complete!\n'));

  if (allSuccess) {
    console.log(chalk.cyan('  Run `npm run po` to open Storybook'));
    console.log(chalk.cyan('  Or use: npx crucible pg:open <framework>\n'));
  }
}

export async function promptGenerateIfNeeded(framework: Framework): Promise<boolean> {
  if (isGenerated(framework)) {
    return true;
  }

  console.log(chalk.yellow(`\n⚠  ${framework} playground not generated yet.`));

  const shouldGenerate = await confirm({
    message: `Generate ${framework} playground first?`,
    default: true,
  });

  if (shouldGenerate) {
    await generatePlayground({ framework, stories: true, force: true });
    return true;
  }

  return false;
}

export function getStorybookPort(framework: string): number {
  return STORYBOOK_PORTS[framework] || 6006;
}

export { FRAMEWORKS, COMPONENTS, type Framework };

const isMain = require.main === module;

if (isMain) {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');

  if (force) {
    console.log(chalk.yellow('\n⚠  --force flag is active'));
    console.log(
      chalk.gray('   This will clean up existing generated files before regenerating.\n'),
    );
  }

  const validFrameworks = [...FRAMEWORKS];
  const framework = args.find((arg) => validFrameworks.includes(arg as Framework)) as
    | Framework
    | undefined;
  const stories = !args.includes('--no-stories');

  generatePlayground({
    framework: framework || 'all',
    stories,
    force,
  }).catch(console.error);
}
