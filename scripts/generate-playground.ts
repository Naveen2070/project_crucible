import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const FRAMEWORKS = ['react', 'angular', 'vue'] as const;
const COMPONENTS = ['Button', 'Input', 'Card', 'Modal', 'Select'];
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

function isGenerated(framework: Framework): boolean {
  const genPath = getGeneratedPath(framework);
  return fs.existsSync(genPath) && fs.readdirSync(genPath).length > 0;
}

async function createConfig(framework: Framework): Promise<void> {
  const configPath = getConfigPath(framework);
  const config: Record<string, unknown> = {
    version: '1.0.0',
    framework,
    styleSystem: 'css',
    theme: 'minimal',
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
      focusRingOffset: '2px',
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

async function generateFramework(
  framework: Framework,
  options: GenerateOptions,
): Promise<{ success: boolean; error?: string }> {
  const playgroundPath = getPlaygroundPath(framework);

  console.log(chalk.cyan(`\n📦 Generating ${framework} playground...`));

  try {
    await fs.ensureDir(path.join(playgroundPath, 'src'));
    await createConfig(framework);

    const componentsArg = COMPONENTS.join(' ');
    const flags = options.stories ? '--stories -y' : '-y';

    console.log(chalk.gray(`  Running: crucible add ${componentsArg} ${flags}`));

    execSync(`node "${CLI_PATH}" add ${componentsArg} ${flags}`, {
      cwd: playgroundPath,
      stdio: options.stories ? 'inherit' : 'pipe',
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    const generatedCount = fs.readdirSync(getGeneratedPath(framework)).length;
    console.log(chalk.green(`  ✓ ${framework}: ${generatedCount} components generated`));

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
    await generatePlayground({ framework, stories: true });
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
  const framework = args[0] as Framework | undefined;
  const stories = !args.includes('--no-stories');

  generatePlayground({
    framework: framework || 'all',
    stories,
  }).catch(console.error);
}
