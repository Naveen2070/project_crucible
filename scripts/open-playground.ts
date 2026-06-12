import { execSync } from 'child_process';
import ansis from 'ansis';
import { select } from '@inquirer/prompts';
import {
  FRAMEWORKS,
  type Framework,
  assertFramework,
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
  assertFramework(framework);
  const playgroundPath = path.join(process.cwd(), 'playground', framework);
  const port = getStorybookPort(framework);

  console.log(ansis.cyan(`\n📖 Opening Storybook for ${framework} on port ${port}...`));

  // Every playground (including Angular) exposes a `storybook` npm script after
  // `storybook init`; using it keeps this project-name agnostic.
  const command = 'npm';
  const args = ['run', 'storybook'];

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: playgroundPath,
      stdio: 'inherit',
      shell: true,
      env: { ...process.env, STORYBOOK_PORT: String(port) },
    });

    child.on('error', (err) => {
      console.error(ansis.red(`\n✗ Failed to start Storybook: ${err.message}`));
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
    console.log(ansis.yellow('Cannot open Storybook without generated playground.'));
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
    console.log(ansis.yellow('Cannot start dev server without generated playground.'));
    return;
  }

  assertFramework(selectedFramework);
  const playgroundPath = path.join(process.cwd(), 'playground', selectedFramework);
  const hasDevScript = selectedFramework === 'react' || selectedFramework === 'vue';

  if (hasDevScript) {
    console.log(ansis.cyan(`\n🚀 Starting dev server for ${selectedFramework}...`));
    const child = spawn('npm', ['run', 'dev'], {
      cwd: playgroundPath,
      stdio: 'inherit',
      shell: true,
    });
    child.on('error', (err) => {
      console.error(ansis.red(`\n✗ Failed to start dev server: ${err.message}`));
    });
  } else if (selectedFramework === 'angular') {
    console.log(ansis.cyan(`\n🚀 Starting Angular dev server...`));
    const child = spawn('npx', ['ng', 'serve', '--port', '4200'], {
      cwd: playgroundPath,
      stdio: 'inherit',
      shell: true,
    });
    child.on('error', (err) => {
      console.error(ansis.red(`\n✗ Failed to start Angular dev server: ${err.message}`));
    });
  } else {
    console.log(ansis.yellow(`\n⚠  ${selectedFramework} does not have a dev script.`));
    console.log(ansis.gray('  Use Storybook instead: npx crucible pg:open'));
  }
}

const isMain = require.main === module;

if (isMain) {
  const args = process.argv.slice(2);
  const command = args[0] || 'open';
  const framework = args[1] as Framework | undefined;
  if (framework !== undefined) assertFramework(framework);

  if (command === 'dev') {
    devPlayground(framework).catch(console.error);
  } else {
    openPlayground(framework).catch(console.error);
  }
}
