import Handlebars from 'handlebars';
import * as fs from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { ComponentModel } from '../components/model';
import { Framework, StyleSystem } from '../core/enums';
import { FRAMEWORK_TARGETS } from '../registry/frameworks';
import { pathExists } from '../utils/fs';
import { pluginRegistry } from '../plugins/registry';
import { IS_DEV_MODE } from '../config/dev-mode';

Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('includes', (arr: any[], val: any) => arr?.includes(val));
Handlebars.registerHelper('capitalize', (str: string) =>
  str ? str[0].toUpperCase() + str.slice(1) : str,
);
Handlebars.registerHelper('toLowerCase', (str: string) => str?.toLowerCase());
Handlebars.registerHelper('kebab', (str: string) =>
  str
    .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
    .toLowerCase()
    .replace(/^-/, ''),
);
Handlebars.registerHelper('hbs', (str: string) => `{{${str}}}`);

const templateCache = new Map<string, HandlebarsTemplateDelegate>();
const loadedRoots = new Set<string>();
let globalWatcher: ReturnType<typeof chokidar.watch> | null = null;
const frameworkWatchers = new Map<string, ReturnType<typeof chokidar.watch>>();

// Hot-reload watchers are only useful when developing Crucible itself (a checkout
// with playground/ + scripts/). For installed CLIs IS_DEV_MODE is false, so we never
// spin up chokidar watchers on the templates dir inside the user's node_modules.
const watchEnabled = IS_DEV_MODE;

function getCoreTemplatesRoot(): string {
  return path.join(__dirname, '../../templates');
}

/**
 * Reject render inputs that don't map to a known, in-tree target before any path is built
 * from them. `framework`/`styleSystem`/`name` ultimately originate from CLI argv and are used
 * to locate the `.hbs` files we then compile (Handlebars compiles templates to executable JS),
 * so validating them against fixed allowlists keeps an unknown name from steering a read+compile
 * at an arbitrary path. Membership checks here are the security barrier for that flow.
 */
function assertModelInputs(model: ComponentModel): void {
  if (!Object.values(Framework).includes(model.framework as Framework)) {
    throw new Error(`Unsupported framework: ${model.framework}`);
  }
  if (!Object.values(StyleSystem).includes(model.styleSystem as StyleSystem)) {
    throw new Error(`Unsupported style system: ${model.styleSystem}`);
  }
  if (!pluginRegistry.getAllComponentIds().includes(model.name)) {
    throw new Error(`Unknown component: ${model.name}`);
  }
}

/**
 * Read + compile a template, refusing any path that resolves outside `root`. Defense-in-depth
 * alongside `assertModelInputs`: even a registered name can't be used to escape the trusted
 * templates tree (mirrors the path-traversal guard in scaffold/writer.ts). Results are cached
 * by absolute template path.
 */
async function compileTemplateFile(
  tplPath: string,
  root: string,
): Promise<HandlebarsTemplateDelegate> {
  const rel = path.relative(path.resolve(root), path.resolve(tplPath));
  if (rel.startsWith('..') || path.isAbsolute(rel)) {
    throw new Error(`Security: template path escapes root: ${tplPath}`);
  }

  let compiled = templateCache.get(tplPath);
  if (!compiled) {
    const source = await readFile(tplPath, 'utf-8');
    compiled = Handlebars.compile(source);
    templateCache.set(tplPath, compiled);
  }
  return compiled;
}

async function registerPartials(framework: string, templatesRoot: string) {
  const coreRoot = getCoreTemplatesRoot();

  // 1. Core shared partials
  const coreShared = path.join(coreRoot, 'shared');
  if (!loadedRoots.has(coreShared) && await pathExists(coreShared)) {
    await registerPartialsFromDir(coreShared, 'shared');
    loadedRoots.add(coreShared);
  }

  // 2. Core framework shared partials
  const coreFrameworkShared = path.join(coreRoot, framework, 'shared');
  if (!loadedRoots.has(coreFrameworkShared) && await pathExists(coreFrameworkShared)) {
    await registerPartialsFromDir(coreFrameworkShared, framework);
    loadedRoots.add(coreFrameworkShared);
  }

  // 3. Plugin shared partials (if different from core)
  if (templatesRoot && path.resolve(templatesRoot) !== path.resolve(coreRoot)) {
    const pluginShared = path.join(templatesRoot, 'shared');
    if (!loadedRoots.has(pluginShared) && await pathExists(pluginShared)) {
      await registerPartialsFromDir(pluginShared, 'shared');
      loadedRoots.add(pluginShared);
    }

    const pluginFrameworkShared = path.join(templatesRoot, framework, 'shared');
    if (!loadedRoots.has(pluginFrameworkShared) && await pathExists(pluginFrameworkShared)) {
      await registerPartialsFromDir(pluginFrameworkShared, framework);
      loadedRoots.add(pluginFrameworkShared);
    }
  }

  if (watchEnabled) {
    setupFrameworkWatcher(framework, templatesRoot);
  }
}

async function registerPartialsFromDir(dir: string, prefix: string) {
  const files = await readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const fileStat = await stat(filePath);
    if (fileStat.isDirectory()) {
      await registerPartialsFromDir(filePath, prefix ? `${prefix}/${file}` : file);
    } else if (file.endsWith('.hbs')) {
      const baseName = path.basename(file, '.hbs');
      const name = prefix ? `${prefix}/${baseName}` : baseName;
      const content = await readFile(filePath, 'utf-8');
      Handlebars.registerPartial(name, content);
    }
  }
}

function invalidateCache(frameworkRoot?: string) {
  templateCache.clear();

  if (frameworkRoot) {
    loadedRoots.delete(frameworkRoot);
  } else {
    loadedRoots.clear();
  }
}

function setupGlobalWatcher() {
  if (globalWatcher || !watchEnabled) return;

  const root = getCoreTemplatesRoot();
  const sharedPath = path.join(root, 'shared');
  if (!fs.existsSync(sharedPath)) return;

  globalWatcher = chokidar.watch(sharedPath, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  globalWatcher.on('change', () => {
    invalidateCache();
  });
}

function setupFrameworkWatcher(framework: string, templatesRoot: string) {
  const frameworkShared = path.join(templatesRoot, framework, 'shared');
  const watcherKey = frameworkShared;
  
  if (frameworkWatchers.has(watcherKey) || !watchEnabled) return;

  if (!fs.existsSync(frameworkShared)) return;

  const watcher = chokidar.watch(frameworkShared, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher.on('change', () => {
    invalidateCache(frameworkShared);
  });

  frameworkWatchers.set(watcherKey, watcher);
}

async function cleanupWatchers() {
  if (globalWatcher) {
    await globalWatcher.close();
    globalWatcher = null;
  }
  for (const watcher of frameworkWatchers.values()) {
    await watcher.close();
  }
  frameworkWatchers.clear();
}

export async function renderComponent(model: ComponentModel): Promise<Record<string, string>> {
  assertModelInputs(model);

  if (watchEnabled) {
    setupGlobalWatcher();
  }

  const templatesRoot = pluginRegistry.getComponentTemplatesDir(model.name) || getCoreTemplatesRoot();
  await registerPartials(model.framework, templatesRoot);
  
  const tplDir = path.join(templatesRoot, model.framework, model.styleSystem, model.name);
  const result: Record<string, string> = {};

  const resolver = pluginRegistry.getFrameworkResolver(model.framework);
  if (!resolver) throw new Error(`Unsupported framework: ${model.framework}`);

  const allTargets = resolver(model.name, model.styleSystem as StyleSystem);
  const targets = allTargets.filter((t) => !t.isStory || model.generateStories);

  for (const { tpl, out } of targets) {
    let tplPath = path.join(tplDir, tpl);

    // Fallback to CSS styles if SCSS/Tailwind templates are missing in the current templatesRoot
    if (
      (model.styleSystem === StyleSystem.SCSS || model.styleSystem === StyleSystem.Tailwind) &&
      !(await pathExists(tplPath))
    ) {
      const fallbackDir = path.join(
        templatesRoot,
        model.framework,
        StyleSystem.CSS,
        model.name,
      );
      const fallbackPath = path.join(fallbackDir, tpl);
      if (await pathExists(fallbackPath)) {
        tplPath = fallbackPath;
      }
    }

    if (!(await pathExists(tplPath))) continue;

    const compiled = await compileTemplateFile(tplPath, templatesRoot);
    result[out] = compiled(model);
  }

  // Generate README.md with core fallback
  let readmeRoot = templatesRoot;
  let readmePath = path.join(templatesRoot, 'shared', 'component-readme.hbs');
  if (!(await pathExists(readmePath))) {
    readmeRoot = getCoreTemplatesRoot();
    readmePath = path.join(readmeRoot, 'shared', 'component-readme.hbs');
  }

  if (await pathExists(readmePath)) {
    const compiled = await compileTemplateFile(readmePath, readmeRoot);
    result['README.md'] = compiled(model);
  }

  // Generate virtualization-adapters-guide.md for Table component with core fallback
  if (model.name === 'Table') {
    let guideRoot = templatesRoot;
    let guidePath = path.join(
      templatesRoot,
      'shared',
      'virtualization-adapters-guide.md.hbs',
    );
    if (!(await pathExists(guidePath))) {
      guideRoot = getCoreTemplatesRoot();
      guidePath = path.join(guideRoot, 'shared', 'virtualization-adapters-guide.md.hbs');
    }

    if (await pathExists(guidePath)) {
      const compiled = await compileTemplateFile(guidePath, guideRoot);
      result['virtualization-adapters-guide.md'] = compiled(model);
    }
  }

  return result;
}

export async function renderGlobalTokens(model: ComponentModel): Promise<string> {
  assertModelInputs(model);

  const templatesRoot = pluginRegistry.getComponentTemplatesDir(model.name) || getCoreTemplatesRoot();
  await registerPartials(model.framework, templatesRoot);

  let tokensRoot = templatesRoot;
  let tplPath = path.join(templatesRoot, 'shared', 'global-tokens.css.hbs');
  if (!(await pathExists(tplPath))) {
    tokensRoot = getCoreTemplatesRoot();
    tplPath = path.join(tokensRoot, 'shared', 'global-tokens.css.hbs');
  }

  if (!(await pathExists(tplPath))) {
    throw new Error(`Global tokens template not found: ${tplPath}`);
  }

  const compiled = await compileTemplateFile(tplPath, tokensRoot);
  return compiled(model);
}

export { invalidateCache, cleanupWatchers };
