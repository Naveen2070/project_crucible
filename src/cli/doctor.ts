import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { readConfig } from '../config/reader';
import { StyleSystem } from '../core/enums';

export async function runDoctor(opts: { cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  console.log(chalk.cyan(`\n⚗  Crucible Doctor — Checking setup in ${cwd}\n`));

  let configFound = false;
  let tailwindOkay = false;
  let outputDirOkay = false;

  const configPathRelative = path.relative(process.cwd(), path.join(cwd, 'crucible.config.json'));
  let config;

  // 1. Check Config
  try {
    config = await readConfig(configPathRelative);
    console.log(chalk.green('✔ Config file loaded and validated successfully.'));
    configFound = true;
  } catch (error: any) {
    console.log(chalk.red(`✗ Config Error: ${error.message}`));
  }

  if (!configFound) {
    console.log(chalk.yellow('\nRun `crucible init` to create a valid configuration file.'));
    return; // Can't proceed without config
  }

  // 2. Check Tailwind Setup (if applicable)
  if (config?.styleSystem === StyleSystem.Tailwind) {
    try {
      const packageJsonPath = path.join(cwd, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        const pkg = await fs.readJson(packageJsonPath);
        const hasTailwindDeps = pkg.dependencies?.tailwindcss || pkg.devDependencies?.tailwindcss;
        
        let hasTailwindImport = false;
        const cssFiles = [
          'src/index.css', 'src/App.css', 'src/globals.css', 'src/styles.css',
          'app/globals.css', 'styles/globals.css'
        ];

        for (const file of cssFiles) {
          const fullPath = path.join(cwd, file);
          if (await fs.pathExists(fullPath)) {
            const content = await fs.readFile(fullPath, 'utf-8');
            if (content.includes('@import "tailwindcss"') || content.includes('@tailwind base')) {
              hasTailwindImport = true;
              break;
            }
          }
        }

        if (hasTailwindDeps && hasTailwindImport) {
          console.log(chalk.green('✔ Tailwind CSS configuration appears intact.'));
          tailwindOkay = true;
        } else {
           console.log(chalk.red('✗ Tailwind CSS configuration is incomplete or missing.'));
           if (!hasTailwindDeps) console.log(chalk.gray('  - Missing tailwindcss dependency in package.json'));
           if (!hasTailwindImport) console.log(chalk.gray('  - Missing @import "tailwindcss" in global CSS'));
        }
      } else {
         console.log(chalk.yellow('⚠ Could not find package.json to verify Tailwind setup.'));
      }
    } catch (e: any) {
      console.log(chalk.red(`✗ Error checking Tailwind: ${e.message}`));
    }
  } else {
     console.log(chalk.gray('— Tailwind check skipped (not using Tailwind style system).'));
     tailwindOkay = true; // functionally okay since it's not needed
  }

  // 3. Check Output Directory permissions
  try {
    const outDir = path.join(cwd, config?.flags?.outputDir ?? 'src/components');
    await fs.ensureDir(outDir);
    // test write access by writing a temporary empty file
    const testFile = path.join(outDir, '.crucible-test-write');
    await fs.writeFile(testFile, '');
    await fs.remove(testFile);
    console.log(chalk.green(`✔ Output directory (${config?.flags?.outputDir ?? 'src/components'}) is writeable.`));
    outputDirOkay = true;
  } catch (e: any) {
    console.log(chalk.red(`✗ Output Directory Error: Cannot write to output directory. ${e.message}`));
  }

  console.log('\n');
  if (configFound && tailwindOkay && outputDirOkay) {
    console.log(chalk.green.bold('All checks passed! Your Crucible setup is ready to go. 🚀'));
  } else {
    console.log(chalk.yellow.bold('Some checks failed. Please review the errors above.'));
  }
}
