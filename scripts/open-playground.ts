import { execSync } from 'child_process';
import chalk from 'chalk';
import { select } from '@inquirer/prompts';
import {
  FRAMEWORKS,
  type Framework,
  promptGenerateIfNeeded,
  getStorybookPort,
} from './generate-playground';
import { spawn } from 'child_process';
import path from 'path';

const STORYBOOK_SCRIPTS: Record<string, string> = {
  react: 'storybook',
  angular: 'storybook',
  vue: 'storybook',
};

async function selectFramework(allowAll = true): Promise<Framework | 'all'> {
  const choices = allowAll
    ? [
        { name: 'All Frameworks', value: 'all' as const },
        ...FRAMEWORKS.map((fw) => ({
          name: `${fw.charAt(0).toUpperCase() + fw.slice(1)}`,
          value: fw,
        })),
      ]
    : FRAMEWORKS.map((fw) => ({ name: `${fw.charAt(0).toUpperCase() + fw.slice(1)}`, value: fw }));

  return select({
    message: 'Which framework playground?',
    choices,
    default: 'react',
  });
}

async function openStorybook(framework: Framework): Promise<void> {
  const playgroundPath = path.join(process.cwd(), 'playground', framework);
  const port = getStorybookPort(framework);

  console.log(chalk.cyan(`\n📖 Opening Storybook for ${framework} on port ${port}...`));

  const child = spawn('npm', ['run', 'storybook'], {
    cwd: playgroundPath,
    stdio: 'inherit',
    shell: true,
    env: { ...process.env, STORYBOOK_PORT: String(port) },
  });

  child.on('error', (err) => {
    console.error(chalk.red(`\n✗ Failed to start Storybook: ${err.message}`));
  });

  return new Promise((resolve, reject) => {
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Storybook exited with code ${code}`));
    });
  });
}

export async function openPlayground(framework?: Framework): Promise<void> {
  let selectedFramework: Framework | 'all';

  if (framework) {
    selectedFramework = framework;
  } else {
    selectedFramework = await selectFramework(false);
  }

  const isAll = selectedFramework === 'all';
  const frameworks = isAll ? [...FRAMEWORKS] : [selectedFramework];

  for (const fw of frameworks as Framework[]) {
    const generated = await promptGenerateIfNeeded(fw);
    if (!generated) {
      console.log(chalk.yellow(`  Skipped ${fw} - not generated`));
      continue;
    }

    const port = getStorybookPort(fw);
    console.log(chalk.green(`\n✓ ${fw} ready on port ${port}`));
  }

  console.log(chalk.blue('\n🎉 Playgrounds ready!\n'));
  console.log(chalk.cyan('To view Storybook for a specific framework:'));
  for (const fw of frameworks) {
    const port = getStorybookPort(fw);
    console.log(chalk.gray(`  - ${fw}: http://localhost:${port}`));
  }
  console.log('');
}

export async function openStorybookForFramework(framework?: Framework): Promise<void> {
  let selectedFramework: Framework;

  if (framework) {
    selectedFramework = framework;
  } else {
    const selected = await selectFramework(false);
    if (selected === 'all') {
      selectedFramework = 'react';
    } else {
      selectedFramework = selected;
    }
  }

  const generated = await promptGenerateIfNeeded(selectedFramework);
  if (!generated) {
    console.log(chalk.yellow('Cannot open Storybook without generated playground.'));
    return;
  }

  await openStorybook(selectedFramework);
}

export async function devPlayground(framework?: Framework): Promise<void> {
  let selectedFramework: Framework;

  if (framework) {
    selectedFramework = framework;
  } else {
    const selected = await selectFramework(false);
    if (selected === 'all') {
      selectedFramework = 'react';
    } else {
      selectedFramework = selected;
    }
  }

  const generated = await promptGenerateIfNeeded(selectedFramework);
  if (!generated) {
    console.log(chalk.yellow('Cannot start dev server without generated playground.'));
    return;
  }

  const playgroundPath = path.join(process.cwd(), 'playground', selectedFramework);
  const hasDevScript = selectedFramework === 'react' || selectedFramework === 'vue';

  if (hasDevScript) {
    console.log(chalk.cyan(`\n🚀 Starting dev server for ${selectedFramework}...`));
    const child = spawn('npm', ['run', 'dev'], {
      cwd: playgroundPath,
      stdio: 'inherit',
      shell: true,
    });
    child.on('error', (err) => {
      console.error(chalk.red(`\n✗ Failed to start dev server: ${err.message}`));
    });
  } else {
    console.log(chalk.yellow(`\n⚠  ${selectedFramework} does not have a dev script.`));
    console.log(chalk.gray('  Use Storybook instead: npx crucible pg:open'));
  }
}

const isMain = require.main === module;

if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0] || 'open';
  const framework = args[1] as Framework | undefined;

  if (command === 'dev') {
    devPlayground(framework).catch(console.error);
  } else {
    openPlayground(framework).catch(console.error);
  }
}
