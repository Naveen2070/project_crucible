import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { select, input, confirm } from '@inquirer/prompts';
import { checkAndSetupTailwind } from '../utils/tailwind';
import { Framework, StyleSystem } from '../../core/enums';

const DEFAULT_CONFIG = `{
  "$schema": "./node_modules/@cruciblelab/crucible/dist/config/schema.json",
  "version": "1",
  "framework": "react",
  "styleSystem": "css",
  "theme": "minimal",
  "darkMode": false,
  "tokens": {
    "color": {
      "primary": "#6C63FF",
      "secondary": "#F3F2FF",
      "surface": "#FFFFFF",
      "background": "#F8F9FA",
      "border": "#E2E1F0",
      "text": "#1A1A2E",
      "textMuted": "#6B6B8A",
      "destructive": "#E24B4A",
      "success": "#1D9E75"
    },
    "radius": {
      "sm": "4px",
      "md": "8px",
      "lg": "12px"
    },
    "spacing": {
      "unit": "4px"
    },
    "typography": {
      "fontFamily": "system-ui, sans-serif",
      "scaleBase": "16px"
    },
    "components": {
      "button": {
        "borderRadius": "var(--radius-md)"
      },
      "card": {
        "borderRadius": "var(--radius-lg)"
      }
    }
  },
  "features": {
    "hover": true,
    "focusRing": true,
    "motionSafe": true,
    "compoundComponents": true
  },
  "a11y": {
    "focusRingStyle": "outline",
    "focusRingColor": "var(--color-primary)",
    "focusRingWidth": "2px",
    "focusRingOffset": "3px",
    "reduceMotion": true
  },
  "flags": {
    "outputDir": "src/components",
    "stories": false
  }
}
`;

export async function runInit(opts: { yes?: boolean; cwd?: string } = {}) {
  const cwd = opts.cwd || process.cwd();
  const configPath = path.join(cwd, 'crucible.config.json');

  if (await fs.pathExists(configPath)) {
    if (!opts.yes) {
      const overwrite = await confirm({
        message: 'crucible.config.json already exists. Overwrite?',
        default: false,
      });
      if (!overwrite) {
        console.log(chalk.gray('Init cancelled.'));
        return;
      }
    }
  }

  let framework: string = Framework.React;
  let styleSystem: string = StyleSystem.CSS;
  let outputDir = 'src/components';
  let compoundComponents = true;
  let generateStories = false;

  if (!opts.yes) {
    framework = await select({
      message: 'Which framework are you using?',
      choices: [
        { name: 'React', value: Framework.React },
        { name: 'Angular', value: Framework.Angular },
        { name: 'Vue 3', value: Framework.Vue },
      ],
    });

    styleSystem = await select({
      message: 'Which styling system do you want to use?',
      choices: [
        { name: 'CSS Modules (Vanilla)', value: StyleSystem.CSS },
        { name: 'SCSS Modules', value: StyleSystem.SCSS },
        { name: 'Tailwind CSS', value: StyleSystem.Tailwind },
      ],
    });

    if (framework !== Framework.Angular) {
      compoundComponents = await confirm({
        message: 'Prefer compound component pattern? (e.g. <Button.Root>)',
        default: true,
      });
    }

    generateStories = await confirm({
      message: 'Generate Storybook stories by default?',
      default: false,
    });

    outputDir = await input({
      message: 'Where should components be generated?',
      default: 'src/components',
    });
  }

  if (styleSystem === StyleSystem.Tailwind) {
    await checkAndSetupTailwind({ yes: opts.yes, cwd });
  }

  const configContent = DEFAULT_CONFIG.replace(
    '"framework": "react"',
    `"framework": "${framework}"`,
  )
    .replace('"styleSystem": "css"', `"styleSystem": "${styleSystem}"`)
    .replace('"outputDir": "src/components"', `"outputDir": "${outputDir}"`)
    .replace('"compoundComponents": true', `"compoundComponents": ${compoundComponents}`)
    .replace('"stories": false', `"stories": ${generateStories}`);

  await fs.writeFile(configPath, configContent, 'utf-8');
  console.log(chalk.green('✔ Created crucible.config.json with minimal setup.'));
}
