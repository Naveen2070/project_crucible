import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { ComponentModel } from '../components/model';

// Register helpers
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('includes', (arr: any[], val: any) => arr?.includes(val));
Handlebars.registerHelper('capitalize', (str: string) => str[0].toUpperCase() + str.slice(1));
Handlebars.registerHelper('kebab', (str: string) =>
  str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`).toLowerCase(),
);

export async function renderComponent(model: ComponentModel): Promise<Record<string, string>> {
  // engine.js will be in dist/templates/, so root is ../../
  const tplDir = path.join(
    __dirname,
    '../../templates',
    model.framework,
    model.styleSystem,
    model.name,
  );
  const result: Record<string, string> = {};

  const targets = [];
  targets.push({ tpl: `${model.name}.tsx.hbs`, out: `${model.name}.tsx` });

  if (model.styleSystem === 'css') {
    targets.push({ tpl: `${model.name}.module.css.hbs`, out: `${model.name}.module.css` });
  }

  if (model.generateStories) {
    targets.push({ tpl: `${model.name}.stories.tsx.hbs`, out: `${model.name}.stories.tsx` });
  }

  for (const { tpl, out } of targets) {
    const tplPath = path.join(tplDir, tpl);
    console.log(`DEBUG: Reading template from ${tplPath}`);
    if (!(await fs.pathExists(tplPath))) continue;
    const source = await fs.readFile(tplPath, 'utf-8');
    const compiled = Handlebars.compile(source);
    result[out] = compiled(model);
  }

  return result;
}
