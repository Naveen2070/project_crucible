import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { select, input, confirm } from '@inquirer/prompts';

const DEFAULT_CONFIG = `{
  "$schema": "https://raw.githubusercontent.com/crucible-ui/crucible/main/schema.json",
  "version": "1",
  "framework": "react",
  // Choose "css" for Vanilla CSS Modules, or "tailwind"
  "styleSystem": "css",
  // Base theme preset (e.g. "minimal" or "soft")
  "theme": "minimal",
  // Override or add new tokens here
  "tokens": {
    "color": {
      "primary": "#6C63FF",
      "surface": "#FFFFFF",
      "background": "#F8F9FA",
      "border": "#E2E1F0",
      "text": "#1A1A2E",
      "danger": "#E24B4A"
    },
    "radius": {
      "md": "8px"
    }
  },
  "flags": {
    // Directory where components will be generated
    "outputDir": "src/components"
  }
}
`;

export async function runInit() {
  const configPath = path.join(process.cwd(), 'crucible.config.json');

  if (await fs.pathExists(configPath)) {
    const overwrite = await confirm({ message: 'crucible.config.json already exists. Overwrite?', default: false });
    if (!overwrite) {
      console.log(chalk.gray('Init cancelled.'));
      return;
    }
  }

  const styleSystem = await select({
    message: 'Which styling system do you want to use?',
    choices: [
      { name: 'CSS Modules (Vanilla)', value: 'css' },
      { name: 'Tailwind CSS', value: 'tailwind' },
    ],
  });

  const outputDir = await input({
    message: 'Where should components be generated?',
    default: 'src/components',
  });

  const configContent = DEFAULT_CONFIG
    .replace('"styleSystem": "css"', `"styleSystem": "${styleSystem}"`)
    .replace('"outputDir": "src/components"', `"outputDir": "${outputDir}"`);

  await fs.writeFile(configPath, configContent, 'utf-8');
  console.log(chalk.green('✔ Created crucible.config.json with minimal setup.'));
}
