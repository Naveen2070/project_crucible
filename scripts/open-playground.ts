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

async function selectFramework(): Promise<Framework> {
  const choices = FRAMEWORKS.map((fw) => ({
    name: `${fw.charAt(0).toUpperCase() + fw.slice(1)} (port ${getStorybookPort(fw)})`,
    value: fw,
  }));

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

  let command: string;
  let args: string[];

  if (framework === 'angular') {
    command = 'npx';
    args = ['ng', 'run', 'playground-angular:storybook'];
  } else {
    command = 'npm';
    args = ['run', 'storybook'];
  }

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: playgroundPath,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, STORYBOOK_PORT: String(port) },
    });

    child.on('error', (err) => {
      console.error(chalk.red(`\n✗ Failed to start Storybook: ${err.message}`));
      reject(err);
    });

    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Storybook exited with code ${code}`));
    });
  });
}

export async function openPlayground(framework?: Framework): Promise<void> {
  let selectedFramework: Framework;

  if (framework) {
    selectedFramework = framework;
  } else {
    selectedFramework = await selectFramework();
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
    selectedFramework = await selectFramework();
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
  } else if (selectedFramework === 'angular') {
    console.log(chalk.cyan(`\n🚀 Starting Angular dev server...`));
    const child = spawn('npx', ['ng', 'serve', '--port', '4200'], {
      cwd: playgroundPath,
      stdio: 'inherit',
      shell: true,
    });
    child.on('error', (err) => {
      console.error(chalk.red(`\n✗ Failed to start Angular dev server: ${err.message}`));
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
