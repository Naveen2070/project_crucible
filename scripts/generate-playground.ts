import * as fs from 'node:fs';
import { readFile, writeFile, access, mkdir, rm, readdir } from 'node:fs/promises';
import path from 'path';
import { execSync } from 'child_process';
import ansis from 'ansis';
import { confirm } from '@inquirer/prompts';

const readdirSync = fs.readdirSync;
const existsSync = fs.existsSync;

const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
const writeJson = (p: string, data: unknown, opts?: { spaces?: number }) =>
  writeFile(p, JSON.stringify(data, null, opts?.spaces ?? 2));
const ensureDir = (p: string) => mkdir(p, { recursive: true });
const remove = (p: string) => rm(p, { recursive: true, force: true });

const ROOT_DIR = process.cwd();
const CLI_PATH = path.join(ROOT_DIR, 'dist/cli/index.js');
const FRAMEWORKS = ['react', 'angular', 'vue'] as const;
const COMPONENTS = [
  'Button',
  'Input',
  'Card',
  'Dialog',
  'Select',
  'Table',
  'Popover',
  'Toast',
  'Form',
  'Tabs',
  'Tooltip',
  'Label',
  'Separator',
  'Badge',
  'Skeleton',
  'Avatar',
  'Textarea',
  'Checkbox',
  'Switch',
  'Alert',
  'Progress',
  'Breadcrumb',
  'RadioGroup',
  'Accordion',
  'DropdownMenu',
];
const STORYBOOK_PORTS: Record<string, number> = {
  react: 6006,
  angular: 6007,
  vue: 6008,
};

type Framework = (typeof FRAMEWORKS)[number];

interface GenerateOptions {
  framework?: Framework | 'all';
  styleSystem?: 'css' | 'tailwind' | 'scss';
  stories?: boolean;
  force?: boolean;
}

/**
 * Reject any framework value that isn't a known target before it's used to build a filesystem
 * path or shell command. `framework` originates from CLI argv, and every playground path derives
 * from `getPlaygroundPath`, so guarding here sanitizes the whole chain (path.join + execSync).
 */
export function assertFramework(fw: string): asserts fw is Framework {
  if (!(FRAMEWORKS as readonly string[]).includes(fw)) {
    throw new Error(`Unknown framework "${fw}". Expected one of: ${FRAMEWORKS.join(', ')}`);
  }
}

function getPlaygroundPath(framework: Framework): string {
  assertFramework(framework);
  return path.join(ROOT_DIR, 'playground', framework);
}

function getConfigPath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), 'crucible.config.json');
}

function getGeneratedPath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), 'src', '__generated__');
}

function getPublicGeneratedPath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), 'public', '__generated__');
}

function getCruciblePath(framework: Framework): string {
  return path.join(getPlaygroundPath(framework), '.crucible');
}

function isGenerated(framework: Framework): boolean {
  const genPath = getGeneratedPath(framework);
  return existsSync(genPath) && fs.readdirSync(genPath).length > 0;
}

function checkPlaygroundDependencies(framework: Framework): boolean {
  const playgroundPath = getPlaygroundPath(framework);
  const pkgPath = path.join(playgroundPath, 'package.json');
  if (!existsSync(pkgPath)) return false;

  try {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf-8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };
    const hasStorybook = !!deps.storybook;
    let hasFramework = false;
    if (framework === 'react') hasFramework = !!deps.react;
    else if (framework === 'vue') hasFramework = !!deps.vue;
    else if (framework === 'angular') hasFramework = !!deps['@angular/core'];
    return hasStorybook && hasFramework;
  } catch {
    return false;
  }
}

async function scaffoldPlayground(framework: Framework): Promise<void> {
  const playgroundPath = getPlaygroundPath(framework);
  console.log(
    ansis.yellow(
      `  Missing dependencies or uninitialized playground for ${framework}. Scaffolding...`,
    ),
  );

  const rootPlayground = path.join(ROOT_DIR, 'playground');
  await ensureDir(rootPlayground);

  try {
    if (framework === 'react') {
      execSync(`npm create vite@latest ${framework} -- --template react-ts -y`, {
        cwd: rootPlayground,
        stdio: 'inherit',
      });
      execSync('npm install', { cwd: playgroundPath, stdio: 'inherit' });
    } else if (framework === 'vue') {
      execSync(`npm create vite@latest ${framework} -- --template vue-ts -y`, {
        cwd: rootPlayground,
        stdio: 'inherit',
      });
      execSync('npm install', { cwd: playgroundPath, stdio: 'inherit' });
    } else if (framework === 'angular') {
      execSync(
        `npx @angular/cli@latest new ${framework} --directory ${framework} --defaults --skip-git --style=css`,
        { cwd: rootPlayground, stdio: 'inherit' },
      );
      // @storybook/angular's peer range lags the latest Angular devkit; relax the
      // strict peer check for this playground so installs are reproducible.
      await writeFile(
        path.join(playgroundPath, '.npmrc'),
        'legacy-peer-deps=true\n',
      );
      execSync('npm install --legacy-peer-deps', { cwd: playgroundPath, stdio: 'inherit' });
    }

    console.log(ansis.cyan(`  Initializing Storybook for ${framework}...`));
    execSync(`npx storybook@latest init -y`, { cwd: playgroundPath, stdio: 'inherit' });

    await patchStorybookConfig(framework);
  } catch (error: any) {
    throw new Error(`Failed to scaffold ${framework} playground: ${error.message}`);
  }
}

/**
 * Re-wire a freshly `storybook init`-ed playground to Crucible's generation
 * pipeline: scope stories to `src/__generated__`, import the generated
 * tokens.css, and align the Storybook dev port with STORYBOOK_PORTS.
 */
async function patchStorybookConfig(framework: Framework): Promise<void> {
  const pg = getPlaygroundPath(framework);
  const sbDir = path.join(pg, '.storybook');
  const port = STORYBOOK_PORTS[framework];

  const pick = (names: string[]) => names.map((n) => path.join(sbDir, n)).find(existsSync);

  // 1. main.* — discover ONLY Crucible-generated stories (drop the init examples).
  //    The `stories` key may be quoted ("stories") or unquoted depending on the
  //    framework's storybook-init output, so match both.
  const mainFile = pick(['main.ts', 'main.js', 'main.mjs', 'main.tsx']);
  if (mainFile) {
    let main = await readFile(mainFile, 'utf-8');
    main = main.replace(
      /["']?stories["']?:\s*\[[^\]]*\]/m,
      `stories: [\n    '../src/__generated__/**/*.mdx',\n    '../src/__generated__/**/*.stories.@(js|jsx|mjs|ts|tsx)',\n  ]`,
    );
    await writeFile(mainFile, main);
    console.log(ansis.gray(`  Patched ${framework}/.storybook/${path.basename(mainFile)} stories glob`));
  }

  // 2. preview.* — apply the generated design tokens (React/Vue import CSS directly).
  if (framework !== 'angular') {
    const previewFile = pick(['preview.ts', 'preview.tsx', 'preview.js', 'preview.jsx', 'preview.mjs']);
    if (previewFile) {
      let preview = await readFile(previewFile, 'utf-8');
      const importLine = `import '../public/__generated__/tokens.css';`;
      if (!preview.includes(importLine)) {
        preview = `${importLine}\n${preview}`;
        await writeFile(previewFile, preview);
        console.log(ansis.gray(`  Patched ${framework}/.storybook/${path.basename(previewFile)} tokens import`));
      }
    }
  }

  // 3. ports — React/Vue via the npm script; Angular via angular.json + token styles.
  if (framework !== 'angular') {
    const pkgPath = path.join(pg, 'package.json');
    const pkg = await readJson(pkgPath);
    pkg.scripts = pkg.scripts ?? {};
    if (typeof pkg.scripts.storybook === 'string') {
      pkg.scripts.storybook = `storybook dev -p ${port}`;
    }
    await writeJson(pkgPath, pkg, { spaces: 2 });
  } else {
    const ngJsonPath = path.join(pg, 'angular.json');
    if (existsSync(ngJsonPath)) {
      const ng = await readJson(ngJsonPath);
      const projName = Object.keys(ng.projects ?? {})[0];
      const proj = ng.projects?.[projName];
      const targets = proj?.architect ?? proj?.targets;
      if (targets?.storybook) {
        targets.storybook.options = { ...targets.storybook.options, port };
      }
      // Compodoc (autodocs arg-tables) is fragile to build and not needed for the
      // component playground; disable it on both Storybook targets.
      for (const name of ['storybook', 'build-storybook']) {
        if (targets?.[name]?.options) {
          targets[name].options.compodoc = false;
          delete targets[name].options.compodocArgs;
        }
      }
      // Surface the generated tokens.css through the build target Storybook reuses.
      const build = targets?.build;
      if (build?.options) {
        build.options.styles = build.options.styles ?? [];
        const tokensRef = 'public/__generated__/tokens.css';
        if (!build.options.styles.includes(tokensRef)) build.options.styles.push(tokensRef);
      }
      await writeJson(ngJsonPath, ng, { spaces: 2 });
      console.log(ansis.gray(`  Patched angular.json (storybook port ${port} + tokens style)`));
    }
  }
}

async function cleanupPlayground(framework: Framework): Promise<void> {
  const pgPath = getPlaygroundPath(framework);
  const pathsToDelete = [
    getConfigPath(framework),
    getGeneratedPath(framework),
    getPublicGeneratedPath(framework),
    getCruciblePath(framework),
  ];

  console.log(ansis.gray(`  Cleaning up existing files...`));
  for (const p of pathsToDelete) {
    if (existsSync(p)) {
      await remove(p);
      console.log(ansis.gray(`    Removed: ${path.relative(pgPath, p)}`));
    }
  }
}

async function createConfig(framework: Framework): Promise<void> {
  const configPath = getConfigPath(framework);
  const config: Record<string, unknown> = {
    version: '1',
    framework,
    styleSystem: 'css',
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
      radius: {
        sm: '4px',
        md: '8px',
        lg: '12px',
      },
      spacing: {
        unit: '4px',
      },
      typography: {
        fontFamily: 'system-ui, -apple-system, sans-serif',
        scaleBase: '16px',
      },
    },
    features: {
      hover: true,
      focusRing: true,
      motionSafe: true,
      compoundComponents: true,
    },
    a11y: {
      focusRingStyle: 'outline',
      focusRingColor: 'var(--color-primary)',
      focusRingWidth: '2px',
      focusRingOffset: '3px',
      reduceMotion: true,
    },
    flags: {
      outputDir: 'src/__generated__',
      stories: true,
    },
  };

  await writeJson(configPath, config, { spaces: 2 });
  console.log(ansis.gray(`  Created ${framework}/crucible.config.json`));
}

async function installDependencies(framework: Framework): Promise<void> {
  const playgroundPath = getPlaygroundPath(framework);
  console.log(ansis.gray(`  Installing dependencies for ${framework}...`));

  // Angular: @storybook/angular peers an older devkit than Angular 22 ships, so
  // relax npm's strict peer resolution (the resulting tree builds correctly).
  const installCmd = framework === 'angular' ? 'npm install --legacy-peer-deps' : 'npm install';

  try {
    execSync(installCmd, {
      cwd: playgroundPath,
      stdio: 'inherit',
    });
    console.log(ansis.gray(`  Dependencies installed`));
  } catch (error: any) {
    console.log(ansis.yellow(`  Warning: Some dependencies may not have installed correctly`));
  }
}

async function generateFramework(
  framework: Framework,
  options: GenerateOptions,
): Promise<{ success: boolean; error?: string }> {
  const playgroundPath = getPlaygroundPath(framework);

  console.log(ansis.cyan(`\n📦 Generating ${framework} playground...`));

  try {
    if (options.force) {
      await cleanupPlayground(framework);
    }

    const isSetup = checkPlaygroundDependencies(framework);
    if (!isSetup) {
      await scaffoldPlayground(framework);
    } else {
      await installDependencies(framework);
    }

    await ensureDir(path.join(playgroundPath, 'src'));
    await createConfig(framework);

    const shouldGenerate = options.force || !isGenerated(framework);

    if (shouldGenerate) {
      const componentsArg = COMPONENTS.join(' ');
      const flags = options.stories ? '--stories -y --dev' : '-y --dev';

      console.log(ansis.gray(`  Running: crucible add ${componentsArg} ${flags}`));

      execSync(`node "${CLI_PATH}" add ${componentsArg} ${flags}`, {
        cwd: playgroundPath,
        stdio: 'inherit',
      });
    } else {
      console.log(ansis.gray(`  Components already generated, skipping...`));
    }

    const generatedCount = existsSync(getGeneratedPath(framework))
      ? fs.readdirSync(getGeneratedPath(framework)).length
      : 0;
    console.log(ansis.green(`  ✓ ${framework}: ${generatedCount} components ready`));

    return { success: true };
  } catch (error: any) {
    const errorMsg = error.message || String(error);
    console.log(ansis.red(`  ✗ ${framework}: ${errorMsg}`));
    return { success: false, error: errorMsg };
  }
}

export async function generatePlayground(options: GenerateOptions = {}): Promise<void> {
  const framework = options.framework || 'all';
  const frameworks = framework === 'all' ? [...FRAMEWORKS] : [framework as Framework];

  console.log(ansis.blue('\n🚀 Crucible Playground Generator\n'));
  console.log(ansis.gray(`CLI: ${CLI_PATH}`));
  console.log(ansis.gray(`Frameworks: ${frameworks.join(', ')}`));
  console.log(ansis.gray(`Stories: ${options.stories !== false}`));
  console.log(ansis.gray(`Force: ${options.force || false}`));

  const results: Record<string, { success: boolean; error?: string }> = {};

  for (const fw of frameworks) {
    results[fw] = await generateFramework(fw, options);
  }

  console.log(ansis.blue('\n📊 Summary:\n'));
  let allSuccess = true;
  for (const [fw, result] of Object.entries(results)) {
    if (result.success) {
      console.log(ansis.green(`  ✓ ${fw}`));
    } else {
      console.log(ansis.red(`  ✗ ${fw}: ${result.error}`));
      allSuccess = false;
    }
  }

  console.log(ansis.blue('\n🎉 Playground generation complete!\n'));

  if (allSuccess) {
    console.log(ansis.cyan('  Run `npm run po` to open Storybook'));
    console.log(ansis.cyan('  Or use: npx crucible pg:open <framework>\n'));
  }
}

export async function promptGenerateIfNeeded(framework: Framework): Promise<boolean> {
  if (isGenerated(framework)) {
    return true;
  }

  console.log(ansis.yellow(`\n⚠  ${framework} playground not generated yet.`));

  const shouldGenerate = await confirm({
    message: `Generate ${framework} playground first?`,
    default: true,
  });

  if (shouldGenerate) {
    await generatePlayground({ framework, stories: true, force: true });
    return true;
  }

  return false;
}

export function getStorybookPort(framework: string): number {
  return STORYBOOK_PORTS[framework] || 6006;
}

export { FRAMEWORKS, COMPONENTS, type Framework };

const isMain = require.main === module;

if (isMain) {
  const args = process.argv.slice(2);
  const force = args.includes('--force') || args.includes('-f');

  if (force) {
    console.log(ansis.yellow('\n⚠  --force flag is active'));
    console.log(
      ansis.gray('   This will clean up existing generated files before regenerating.\n'),
    );
  }

  const validFrameworks = [...FRAMEWORKS];
  const framework = args.find((arg) => validFrameworks.includes(arg as Framework)) as
    | Framework
    | undefined;
  const stories = !args.includes('--no-stories');

  generatePlayground({
    framework: framework || 'all',
    stories,
    force,
  }).catch(console.error);
}
