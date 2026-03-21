import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { select, input, confirm } from '@inquirer/prompts';

const DEFAULT_CONFIG = `{
  "$schema": "https://raw.githubusercontent.com/crucible-ui/crucible/main/schema.json",
  "version": "1",
  "framework": "react",
  "styleSystem": "css",
  "theme": "minimal",
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
  "features": {
    "hover": true,
    "focusRing": true,
    "motionSafe": true
  },
  "a11y": {
    "focusRingStyle": "outline",
    "focusRingColor": "var(--color-primary)",
    "focusRingWidth": "2px",
    "focusRingOffset": "3px",
    "reduceMotion": true
  },
  "flags": {
    "outputDir": "src/components"
  }
}
`;

export async function runInit(opts: { yes?: boolean } = {}) {
  const configPath = path.join(process.cwd(), 'crucible.config.json');

  if (await fs.pathExists(configPath)) {
    if (!opts.yes) {
      const overwrite = await confirm({ message: 'crucible.config.json already exists. Overwrite?', default: false });
      if (!overwrite) {
        console.log(chalk.gray('Init cancelled.'));
        return;
      }
    }
  }

  let framework = 'react';
  let styleSystem = 'css';
  let outputDir = 'src/components';

  if (!opts.yes) {
    framework = await select({
      message: 'Which framework are you using?',
      choices: [
        { name: 'React', value: 'react' },
        { name: 'Angular', value: 'angular' },
        { name: 'Vue 3', value: 'vue' },
      ],
    });

    styleSystem = await select({
      message: 'Which styling system do you want to use?',
      choices: [
        { name: 'CSS Modules (Vanilla)', value: 'css' },
        { name: 'SCSS Modules', value: 'scss' },
        { name: 'Tailwind CSS', value: 'tailwind' },
      ],
    });

    outputDir = await input({
      message: 'Where should components be generated?',
      default: 'src/components',
    });
  }

  const configContent = DEFAULT_CONFIG
    .replace('"framework": "react"', `"framework": "${framework}"`)
    .replace('"styleSystem": "css"', `"styleSystem": "${styleSystem}"`)
    .replace('"outputDir": "src/components"', `"outputDir": "${outputDir}"`);

  await fs.writeFile(configPath, configContent, 'utf-8');
  console.log(chalk.green('✔ Created crucible.config.json with minimal setup.'));
}
