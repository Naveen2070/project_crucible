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

Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('includes', (arr: any[], val: any) => arr?.includes(val));
Handlebars.registerHelper('capitalize', (str: string) => str[0].toUpperCase() + str.slice(1));
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

const isProduction = process.env.NODE_ENV === 'production';

function getCoreTemplatesRoot(): string {
  return path.join(__dirname, '../../templates');
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

  if (!isProduction) {
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
  if (globalWatcher || isProduction) return;

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
  
  if (frameworkWatchers.has(watcherKey) || isProduction) return;

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
  if (!isProduction) {
    setupGlobalWatcher();
  }

  const templatesRoot = pluginRegistry.getComponentTemplatesDir(model.name) || getCoreTemplatesRoot();
  await registerPartials(model.framework, templatesRoot);
  
  const tplDir = path.join(templatesRoot, model.framework, model.styleSystem, model.name);
  const result: Record<string, string> = {};

  const resolver = FRAMEWORK_TARGETS[model.framework];
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

    let compiled = templateCache.get(tplPath);
    if (!compiled) {
      const source = await readFile(tplPath, 'utf-8');
      compiled = Handlebars.compile(source);
      templateCache.set(tplPath, compiled);
    }

    result[out] = compiled(model);
  }

  // Generate README.md with core fallback
  let readmePath = path.join(templatesRoot, 'shared', 'component-readme.hbs');
  if (!(await pathExists(readmePath))) {
    readmePath = path.join(getCoreTemplatesRoot(), 'shared', 'component-readme.hbs');
  }

  if (await pathExists(readmePath)) {
    let compiled = templateCache.get(readmePath);
    if (!compiled) {
      const source = await readFile(readmePath, 'utf-8');
      compiled = Handlebars.compile(source);
      templateCache.set(readmePath, compiled);
    }
    result['README.md'] = compiled(model);
  }

  // Generate virtualization-adapters-guide.md for Table component with core fallback
  if (model.name === 'Table') {
    let guidePath = path.join(
      templatesRoot,
      'shared',
      'virtualization-adapters-guide.md.hbs',
    );
    if (!(await pathExists(guidePath))) {
      guidePath = path.join(getCoreTemplatesRoot(), 'shared', 'virtualization-adapters-guide.md.hbs');
    }

    if (await pathExists(guidePath)) {
      let compiled = templateCache.get(guidePath);
      if (!compiled) {
        const source = await readFile(guidePath, 'utf-8');
        compiled = Handlebars.compile(source);
        templateCache.set(guidePath, compiled);
      }
      result['virtualization-adapters-guide.md'] = compiled(model);
    }
  }

  return result;
}

export async function renderGlobalTokens(model: ComponentModel): Promise<string> {
  const templatesRoot = pluginRegistry.getComponentTemplatesDir(model.name) || getCoreTemplatesRoot();
  await registerPartials(model.framework, templatesRoot);
  
  let tplPath = path.join(templatesRoot, 'shared', 'global-tokens.css.hbs');
  if (!(await pathExists(tplPath))) {
    tplPath = path.join(getCoreTemplatesRoot(), 'shared', 'global-tokens.css.hbs');
  }

  if (!(await pathExists(tplPath))) {
    throw new Error(`Global tokens template not found: ${tplPath}`);
  }

  const source = await readFile(tplPath, 'utf-8');
  const compiled = Handlebars.compile(source);
  return compiled(model);
}

export { invalidateCache, cleanupWatchers };
