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
  const tplDir = path.join(process.cwd(), 'templates', model.framework);
  const result: Record<string, string> = {};

  const targets = [
    { tpl: `${model.name}.tsx.hbs`, out: `${model.name}.tsx` },
    { tpl: `${model.name}.module.css.hbs`, out: `${model.name}.module.css` },
    { tpl: `${model.name}.stories.tsx.hbs`, out: `${model.name}.stories.tsx` },
  ];

  for (const { tpl, out } of targets) {
    const tplPath = path.join(tplDir, tpl);
    if (!(await fs.pathExists(tplPath))) continue;
    const source = await fs.readFile(tplPath, 'utf-8');
    const compiled = Handlebars.compile(source);
    result[out] = compiled(model);
  }

  return result;
}
