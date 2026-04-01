import Handlebars from 'handlebars';
import * as fs from 'node:fs';
import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'path';
import chokidar from 'chokidar';
import { ComponentModel } from '../components/model';
import { Framework, StyleSystem } from '../core/enums';
import { FRAMEWORK_TARGETS } from '../registry/frameworks';
import { pathExists } from '../utils/fs';

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
const loadedFrameworks = new Set<string>();
let globalWatcher: ReturnType<typeof chokidar.watch> | null = null;
const frameworkWatchers = new Map<string, ReturnType<typeof chokidar.watch>>();

const isProduction = process.env.NODE_ENV === 'production';

function getTemplatesRoot(): string {
  return path.join(__dirname, '../../templates');
}

async function registerPartials(framework: string) {
  if (loadedFrameworks.has(framework)) {
    return;
  }

  const root = getTemplatesRoot();

  const globalShared = path.join(root, 'shared');
  if (await pathExists(globalShared)) {
    await registerPartialsFromDir(globalShared, 'shared');
  }

  const frameworkShared = path.join(root, framework, 'shared');
  if (await pathExists(frameworkShared)) {
    await registerPartialsFromDir(frameworkShared, framework);
  }

  loadedFrameworks.add(framework);

  if (!isProduction) {
    setupFrameworkWatcher(framework);
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

function invalidateCache(framework?: string) {
  templateCache.clear();

  if (framework) {
    loadedFrameworks.delete(framework);
  } else {
    loadedFrameworks.clear();
  }
}

function setupGlobalWatcher() {
  if (globalWatcher || isProduction) return;

  const root = getTemplatesRoot();
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

function setupFrameworkWatcher(framework: string) {
  if (frameworkWatchers.has(framework) || isProduction) return;

  const root = getTemplatesRoot();
  const frameworkShared = path.join(root, framework, 'shared');
  if (!fs.existsSync(frameworkShared)) return;

  const watcher = chokidar.watch(frameworkShared, {
    ignoreInitial: true,
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher.on('change', () => {
    invalidateCache(framework);
  });

  frameworkWatchers.set(framework, watcher);
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
  await registerPartials(model.framework);
  const tplDir = path.join(getTemplatesRoot(), model.framework, model.styleSystem, model.name);
  const result: Record<string, string> = {};

  const resolver = FRAMEWORK_TARGETS[model.framework];
  if (!resolver) throw new Error(`Unsupported framework: ${model.framework}`);

  const allTargets = resolver(model.name, model.styleSystem as StyleSystem);
  const targets = allTargets.filter((t) => !t.isStory || model.generateStories);

  for (const { tpl, out } of targets) {
    let tplPath = path.join(tplDir, tpl);

    if (
      (model.styleSystem === StyleSystem.SCSS || model.styleSystem === StyleSystem.Tailwind) &&
      !(await pathExists(tplPath))
    ) {
      const fallbackDir = path.join(
        getTemplatesRoot(),
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

  // Generate README.md
  const readmePath = path.join(getTemplatesRoot(), 'shared', 'component-readme.hbs');
  if (await pathExists(readmePath)) {
    let compiled = templateCache.get(readmePath);
    if (!compiled) {
      const source = await readFile(readmePath, 'utf-8');
      compiled = Handlebars.compile(source);
      templateCache.set(readmePath, compiled);
    }
    result['README.md'] = compiled(model);
  }

  // Generate virtualization-adapters-guide.md for Table component
  if (model.name === 'Table') {
    const guidePath = path.join(
      getTemplatesRoot(),
      'shared',
      'virtualization-adapters-guide.md.hbs',
    );
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
  await registerPartials(model.framework);
  const tplPath = path.join(getTemplatesRoot(), 'shared', 'global-tokens.css.hbs');

  if (!(await pathExists(tplPath))) {
    throw new Error(`Global tokens template not found: ${tplPath}`);
  }

  const source = await readFile(tplPath, 'utf-8');
  const compiled = Handlebars.compile(source);
  return compiled(model);
}

export { invalidateCache, cleanupWatchers };
