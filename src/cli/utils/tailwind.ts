import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { confirm } from '@inquirer/prompts';
import { execSync } from 'child_process';

export async function checkAndSetupTailwind(opts: { yes?: boolean; cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) return;
  
  const pkg = await fs.readJson(packageJsonPath);
  const hasTailwind = pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss;

  // Simple scan for tailwind imports
  const cssFiles = [
    'src/index.css', 'src/App.css', 'src/globals.css', 'src/styles.css',
    'app/globals.css', 'styles/globals.css'
  ];

  let hasImport = false;
  let targetCssFile = '';

  for (const file of cssFiles) {
    const fullPath = path.join(cwd, file);
    if (await fs.pathExists(fullPath)) {
      if (!targetCssFile) targetCssFile = fullPath;
      const content = await fs.readFile(fullPath, 'utf-8');
      if (content.includes('@import "tailwindcss"') || content.includes('@tailwind base')) {
        hasImport = true;
        break;
      }
    }
  }

  if (hasTailwind && hasImport) return; // All good

  console.log(chalk.yellow('\n⚠ Tailwind CSS configuration is missing or incomplete.'));
  
  let proceed = true;
  if (!opts.yes) {
    proceed = await confirm({
      message: 'Would you like to automatically set up Tailwind v4?',
      default: true
    });
  }

  if (!proceed) {
    console.log(chalk.gray('Continuing without Tailwind setup...'));
    return;
  }

  console.log(chalk.cyan('Installing Tailwind CSS v4...'));
  try {
    const isVite = pkg.devDependencies?.vite || pkg.dependencies?.vite;
    if (isVite) {
      execSync('npm install tailwindcss @tailwindcss/vite', { stdio: 'inherit' });
      console.log(chalk.cyan('You may need to manually add @tailwindcss/vite to your vite.config.ts'));
    } else {
      execSync('npm install tailwindcss @tailwindcss/postcss', { stdio: 'inherit' });
    }

    if (targetCssFile) {
      const currentContent = await fs.readFile(targetCssFile, 'utf-8');
      if (!currentContent.includes('@import "tailwindcss"')) {
        await fs.writeFile(targetCssFile, `@import "tailwindcss";\n\n${currentContent}`);
        console.log(chalk.green(`✔ Added @import "tailwindcss" to ${path.relative(cwd, targetCssFile)}`));
      }
    } else {
      const newCssFile = path.join(cwd, 'src/index.css');
      await fs.ensureDir(path.dirname(newCssFile));
      await fs.writeFile(newCssFile, '@import "tailwindcss";\n');
      console.log(chalk.green(`✔ Created src/index.css with Tailwind import`));
    }
    console.log(chalk.green('✔ Tailwind v4 setup complete!'));
  } catch (error: any) {
    console.error(chalk.red('✗ Failed to setup Tailwind automatically: ' + error.message));
  }
}
