import { readFile, writeFile } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { select, input, confirm } from '@inquirer/prompts';
import { checkAndSetupTailwind } from '../utils/tailwind';
import { checkReactNativeSetup } from '../utils/react-native';
import { Framework, StyleSystem } from '../../core/enums';
import { FRAMEWORK_STYLE_SYSTEMS } from '../../registry/frameworks';
import { pathExists } from '../../utils/fs';
import { runAdd } from './add';

const STYLE_LABELS: Record<string, string> = {
  [StyleSystem.CSS]: 'CSS Modules (Vanilla)',
  [StyleSystem.SCSS]: 'SCSS Modules',
  [StyleSystem.Tailwind]: 'Tailwind CSS',
  [StyleSystem.NativeWind]: 'NativeWind',
  [StyleSystem.StyleSheet]: 'StyleSheet',
};

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

export async function runInit(
  opts: { yes?: boolean; quiet?: boolean; cwd?: string; skipComponentPrompt?: boolean } = {},
) {
  const cwd = opts.cwd || process.cwd();
  const configPath = path.join(cwd, 'crucible.config.json');

  if (await pathExists(configPath)) {
    if (!opts.yes) {
      const overwrite = await confirm({
        message: 'crucible.config.json already exists. Overwrite?',
        default: false,
      });
      if (!overwrite) {
        console.log(ansis.gray('Init cancelled.'));
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
        { name: 'React Native', value: Framework.ReactNative },
      ],
    });

    const validStyles = FRAMEWORK_STYLE_SYSTEMS[framework] ?? [];
    styleSystem = await select({
      message: 'Which styling system do you want to use?',
      choices: validStyles.map((s) => ({ name: STYLE_LABELS[s] ?? s, value: s })),
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

  if (framework === Framework.ReactNative) {
    await checkReactNativeSetup(styleSystem, { yes: opts.yes, cwd });
  }

  const configContent = DEFAULT_CONFIG.replace(
    '"framework": "react"',
    `"framework": "${framework}"`,
  )
    .replace('"styleSystem": "css"', `"styleSystem": "${styleSystem}"`)
    .replace('"outputDir": "src/components"', `"outputDir": "${outputDir}"`)
    .replace('"compoundComponents": true', `"compoundComponents": ${compoundComponents}`)
    .replace('"stories": false', `"stories": ${generateStories}`);

  await writeFile(configPath, configContent, 'utf-8');
  if (!opts.quiet) console.log(ansis.green('✔ Created crucible.config.json with minimal setup.'));

  // Onboarding: offer to scaffold components right away (the guided picker in `add`).
  if (!opts.yes && !opts.quiet && !opts.skipComponentPrompt) {
    const addNow = await confirm({
      message: 'Add components now?',
      default: true,
    });
    if (addNow) {
      await runAdd([], { cwd, config: 'crucible.config.json' });
    }
  }
}
