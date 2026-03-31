import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { confirm } from '@inquirer/prompts';
import { execSync } from 'child_process';
import { pathExists, readJson } from '../../utils/fs';

export async function checkAndSetupTailwind(opts: { yes?: boolean; cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');

  if (!(await pathExists(packageJsonPath))) return;

  const pkg = await readJson(packageJsonPath);
  const hasTailwind = pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss;

  // Simple scan for tailwind imports
  const cssFiles = [
    'src/index.css',
    'src/App.css',
    'src/globals.css',
    'src/styles.css',
    'app/globals.css',
    'styles/globals.css',
  ];

  let hasImport = false;
  let targetCssFile = '';

  for (const file of cssFiles) {
    const fullPath = path.join(cwd, file);
    if (await pathExists(fullPath)) {
      if (!targetCssFile) targetCssFile = fullPath;
      const content = await readFile(fullPath, 'utf-8');
      if (content.includes('@import "tailwindcss"') || content.includes('@tailwind base')) {
        hasImport = true;
        break;
      }
    }
  }

  if (hasTailwind && hasImport) return; // All good

  console.log(ansis.yellow('\n⚠ Tailwind CSS configuration is missing or incomplete.'));

  let proceed = true;
  if (!opts.yes) {
    proceed = await confirm({
      message: 'Would you like to automatically set up Tailwind v4?',
      default: true,
    });
  }

  if (!proceed) {
    console.log(ansis.gray('Continuing without Tailwind setup...'));
    return;
  }

  console.log(ansis.cyan('Installing Tailwind CSS v4...'));
  try {
    const isVite = pkg.devDependencies?.vite || pkg.dependencies?.vite;
    if (isVite) {
      execSync('npm install tailwindcss @tailwindcss/vite', { stdio: 'inherit' });
      console.log(
        ansis.cyan('You may need to manually add @tailwindcss/vite to your vite.config.ts'),
      );
    } else {
      execSync('npm install tailwindcss @tailwindcss/postcss', { stdio: 'inherit' });
    }

    if (targetCssFile) {
      const currentContent = await readFile(targetCssFile, 'utf-8');
      if (!currentContent.includes('@import "tailwindcss"')) {
        await writeFile(targetCssFile, `@import "tailwindcss";\n\n${currentContent}`);
        console.log(
          ansis.green(`✔ Added @import "tailwindcss" to ${path.relative(cwd, targetCssFile)}`),
        );
      }
    } else {
      const newCssFile = path.join(cwd, 'src/index.css');
      await mkdir(path.dirname(newCssFile), { recursive: true });
      await writeFile(newCssFile, '@import "tailwindcss";\n');
      console.log(ansis.green(`✔ Created src/index.css with Tailwind import`));
    }
    console.log(ansis.green('✔ Tailwind v4 setup complete!'));
  } catch (error: any) {
    console.error(ansis.red('✗ Failed to setup Tailwind automatically: ' + error.message));
  }
}
