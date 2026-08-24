/**
 * RN playground generator — generates React Native components (both style systems) into
 * `playground/rn-expo/` using the built CLI, mirroring scripts/generate-playground.ts
 * conventions. The two style trees live side by side:
 *
 *   rn-expo/components/nativewind/<Comp>/<Comp>.tsx   (+ tailwind.preset.js at root)
 *   rn-expo/components/stylesheet/<Comp>/<Comp>.tsx   (+ theme.ts at root)
 *
 * Usage:  npm run pg:rn [-- --force]
 */
import { execSync } from 'child_process';
import path from 'path';
import { writeFile } from 'node:fs/promises';
import fs from 'node:fs';
import ansis from 'ansis';

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist', 'cli', 'index.js');
const PG_DIR = path.join(ROOT_DIR, 'playground', 'rn-expo');

/** Grows with every completed wave of planning/v1.2.2-rn-completion-and-playground.md */
const RN_COMPONENTS = [
  'Button',
  'Input',
  'Card',
  'Badge',
  'Alert',
  'Label',
  'Avatar',
  'Progress',
  'Separator',
  'Skeleton',
  'Switch',
  'RadioGroup',
  'Textarea',
  'Checkbox',
  'Accordion',
  'Tabs',
  'Dialog',
  'Form',
];
const RN_STYLES = ['nativewind', 'stylesheet'] as const;

const writeJson = (p: string, data: unknown) =>
  writeFile(p, JSON.stringify(data, null, 2), 'utf-8');

function crucibleConfig(styleSystem: string) {
  return {
    version: '1.0.0',
    framework: 'react-native',
    styleSystem,
    theme: 'minimal',
    tokens: {
      color: {
        primary: '#6C63FF',
        secondary: '#F3F2FF',
        surface: '#FFFFFF',
        background: '#F8F9FA',
        border: '#E2E1F0',
        text: '#1A1A2E',
        textMuted: '#6B6B8A',
        destructive: '#E24B4A',
        success: '#1D9E75',
      },
      radius: { sm: '4px', md: '8px', lg: '12px' },
      spacing: { unit: '4px' },
      typography: { fontFamily: 'system-ui, sans-serif', scaleBase: '16px' },
    },
    features: { hover: true, focusRing: true, motionSafe: true, compoundComponents: true },
    a11y: {
      focusRingColor: 'var(--color-primary)',
      focusRingWidth: '2px',
      focusRingOffset: '3px',
      reduceMotion: true,
    },
    flags: { outputDir: `components/${styleSystem}`, stories: true },
  };
}

async function main(): Promise<void> {
  const force = process.argv.includes('--force') || process.argv.includes('-f');

  if (!fs.existsSync(CLI_PATH)) {
    console.error(ansis.red('✗ dist/cli/index.js missing — run `npm run build` first.'));
    process.exit(1);
  }
  if (!fs.existsSync(PG_DIR)) {
    console.error(
      ansis.red(`✗ ${path.relative(ROOT_DIR, PG_DIR)} missing — scaffold it first.`),
    );
    process.exit(1);
  }

  console.log(ansis.blue('\n📱 Crucible RN Playground Generator\n'));

  for (const style of RN_STYLES) {
    console.log(ansis.cyan(`▸ style system: ${style}`));
    await writeJson(path.join(PG_DIR, 'crucible.config.json'), crucibleConfig(style));

    // `-f` so regens pick up template changes even though generated files are "unmodified".
    execSync(`node "${CLI_PATH}" add ${RN_COMPONENTS.join(' ')} --style ${style} -y -f --quiet`, {
      cwd: PG_DIR,
      stdio: 'inherit',
    });
  }

  console.log(
    ansis.green(
      `\n✓ ${RN_COMPONENTS.length} components × ${RN_STYLES.length} styles generated into playground/rn-expo/components`,
    ),
  );
  console.log(ansis.gray('  Tests:     npm run test:rn'));
  console.log(ansis.gray('  Run app:   cd playground/rn-expo && npx expo start\n'));
}

main().catch((err) => {
  console.error(ansis.red(`✗ ${err.message}`));
  process.exit(1);
});
