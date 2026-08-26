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

const RN_PLAYGROUND = path.join(process.cwd(), 'playground', 'rn-expo');
const RN_GENERATED = path.join(RN_PLAYGROUND, 'components');

/**
 * Ensure the RN playground has generated components, running `pg:rn` (which needs a built
 * CLI in dist/) when the components tree is missing.
 */
function ensureRnGenerated(): boolean {
  if (require('fs').existsSync(RN_GENERATED)) return true;
  if (!require('fs').existsSync(path.join(process.cwd(), 'dist', 'cli', 'index.js'))) {
    console.log(ansis.yellow('\n⚠  dist/cli/index.js missing - run `npm run build` first.'));
    return false;
  }
  console.log(ansis.gray('\n  No RN components yet - generating via pg:rn...'));
  try {
    execSync('npm run pg:rn', { cwd: process.cwd(), stdio: 'inherit' });
    return true;
  } catch {
    console.error(ansis.red('\n✗ Component generation failed.'));
    return false;
  }
}

/**
 * Start the Expo dev server for the RN playground. Prints the QR code for Expo Go.
 * `tunnel` routes through ngrok for devices not on the same network.
 */
function startExpo(tunnel: boolean): Promise<void> {
  if (!ensureRnGenerated()) return Promise.resolve();

  console.log(
    ansis.cyan(
      tunnel
        ? '\n📱 Starting Expo (tunnel mode - scan the QR in Expo Go, any network)...'
        : '\n📱 Starting Expo - scan the QR with the Expo Go app (same Wi-Fi)...',
    ),
  );

  return new Promise((resolve, reject) => {
    const args = tunnel ? ['expo', 'start', '--tunnel'] : ['expo', 'start'];
    const child = spawn('npx', args, {
      cwd: RN_PLAYGROUND,
      stdio: 'inherit',
      shell: true,
    });
    child.on('error', (err) => {
      console.error(ansis.red(`\n✗ Failed to start Expo: ${err.message}`));
      reject(err);
    });
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(`Expo exited with code ${code}`));
    });
  });
}


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

  // RN playground: `open rn` / `dev rn` (dev = tunnel mode for off-network devices).
  if (framework === 'rn' || framework === 'expo') {
    const tunnel = command === 'dev';
    startExpo(tunnel).catch(console.error);
  } else {
    if (framework !== undefined) assertFramework(framework);

    if (command === 'dev') {
      devPlayground(framework).catch(console.error);
    } else {
      openPlayground(framework).catch(console.error);
    }
  }
}
