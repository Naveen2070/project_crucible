import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { ComponentModel } from '../components/model';
import { Framework, StyleSystem } from '../core/enums';
import { FRAMEWORK_TARGETS } from '../registry/frameworks';

// Register helpers
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('includes', (arr: any[], val: any) => arr?.includes(val));
Handlebars.registerHelper('capitalize', (str: string) => str[0].toUpperCase() + str.slice(1));
Handlebars.registerHelper('kebab', (str: string) =>
  str
    .replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`)
    .toLowerCase()
    .replace(/^-/, ''),
);

const templateCache = new Map<string, HandlebarsTemplateDelegate>();
let partialsLoaded = false;

async function registerPartials(framework: string) {
  // engine.js will be in dist/templates/, so root is ../../
  // 1. Global shared partials (templates/shared/) - prefixed with "shared/"
  const globalShared = path.join(__dirname, '../../templates/shared');
  if (await fs.pathExists(globalShared)) {
    await registerPartialsFromDir(globalShared, 'shared');
  }

  // 2. Framework-specific partials (templates/react/shared/) - no prefix
  const frameworkShared = path.join(__dirname, `../../templates/${framework}/shared`);
  if (await fs.pathExists(frameworkShared)) {
    await registerPartialsFromDir(frameworkShared, '');
  }
}

async function registerPartialsFromDir(dir: string, prefix: string) {
  const files = await fs.readdir(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = await fs.stat(filePath);
    if (stat.isDirectory()) {
      await registerPartialsFromDir(filePath, prefix ? `${prefix}/${file}` : file);
    } else if (file.endsWith('.hbs')) {
      const baseName = path.basename(file, '.hbs');
      const name = prefix ? `${prefix}/${baseName}` : baseName;
      const content = await fs.readFile(filePath, 'utf-8');
      Handlebars.registerPartial(name, content);
    }
  }
}

export async function renderComponent(model: ComponentModel): Promise<Record<string, string>> {
  await registerPartials(model.framework);
  // engine.js will be in dist/templates/, so root is ../../
  const tplDir = path.join(
    __dirname,
    '../../templates',
    model.framework,
    model.styleSystem,
    model.name,
  );
  const result: Record<string, string> = {};

  const resolver = FRAMEWORK_TARGETS[model.framework];
  if (!resolver) throw new Error(`Unsupported framework: ${model.framework}`);

  const allTargets = resolver(model.name, model.styleSystem as StyleSystem);
  const targets = allTargets.filter((t) => !t.isStory || model.generateStories);

  for (const { tpl, out } of targets) {
    let tplPath = path.join(tplDir, tpl);

    // Fallback logic: If SCSS or Tailwind mode and template doesn't exist, fallback to 'css' folder
    if (
      (model.styleSystem === StyleSystem.SCSS || model.styleSystem === StyleSystem.Tailwind) &&
      !(await fs.pathExists(tplPath))
    ) {
      const fallbackDir = path.join(
        __dirname,
        '../../templates',
        model.framework,
        StyleSystem.CSS,
        model.name,
      );
      const fallbackPath = path.join(fallbackDir, tpl);
      if (await fs.pathExists(fallbackPath)) {
        tplPath = fallbackPath;
      }
    }

    if (!(await fs.pathExists(tplPath))) continue;

    let compiled = templateCache.get(tplPath);
    if (!compiled) {
      const source = await fs.readFile(tplPath, 'utf-8');
      compiled = Handlebars.compile(source);
      templateCache.set(tplPath, compiled);
    }

    result[out] = compiled(model);
  }

  return result;
}
