import Handlebars from 'handlebars';
import fs from 'fs-extra';
import path from 'path';
import { ComponentModel } from '../components/model';
import { Framework, StyleSystem } from '../core/enums';

// Register helpers
Handlebars.registerHelper('eq', (a: any, b: any) => a === b);
Handlebars.registerHelper('includes', (arr: any[], val: any) => arr?.includes(val));
Handlebars.registerHelper('capitalize', (str: string) => str[0].toUpperCase() + str.slice(1));
Handlebars.registerHelper('kebab', (str: string) =>
  str.replace(/([A-Z])/g, (m) => `-${m.toLowerCase()}`).toLowerCase().replace(/^-/, ''),
);

const templateCache = new Map<string, HandlebarsTemplateDelegate>();

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

  const targets: { tpl: string; out: string }[] = [];

  if (model.framework === Framework.React) {
    targets.push({ tpl: `${model.name}.tsx.hbs`, out: `${model.name}.tsx` });
    if (model.styleSystem === StyleSystem.CSS) {
      targets.push({ tpl: `${model.name}.module.css.hbs`, out: `${model.name}.module.css` });
    } else if (model.styleSystem === StyleSystem.SCSS) {
      targets.push({ tpl: `${model.name}.module.scss.hbs`, out: `${model.name}.module.scss` });
    }
    if (model.generateStories) {
      targets.push({ tpl: `${model.name}.stories.tsx.hbs`, out: `${model.name}.stories.tsx` });
    }
  } else if (model.framework === Framework.Angular) {
    const kebabName = model.name.toLowerCase();
    targets.push({ tpl: `${kebabName}.component.ts.hbs`, out: `${kebabName}.component.ts` });
    targets.push({ tpl: `${kebabName}.component.html.hbs`, out: `${kebabName}.component.html` });
    if (model.styleSystem === StyleSystem.CSS) {
      targets.push({ tpl: `${kebabName}.component.css.hbs`, out: `${kebabName}.component.css` });
    } else if (model.styleSystem === StyleSystem.SCSS) {
      targets.push({ tpl: `${kebabName}.component.scss.hbs`, out: `${kebabName}.component.scss` });
    }
    if (model.generateStories) {
      targets.push({ tpl: `${kebabName}.stories.ts.hbs`, out: `${kebabName}.stories.ts` });
    }
  } else if (model.framework === Framework.Vue) {
    targets.push({ tpl: `${model.name}.vue.hbs`, out: `${model.name}.vue` });
    if (model.generateStories) {
      targets.push({ tpl: `${model.name}.stories.ts.hbs`, out: `${model.name}.stories.ts` });
    }
  }

  for (const { tpl, out } of targets) {
    let tplPath = path.join(tplDir, tpl);
    // console.log(`DEBUG: Reading template from ${tplPath}`);

    // Fallback logic: If SCSS or Tailwind mode and template doesn't exist, fallback to 'css' folder
    if ((model.styleSystem === StyleSystem.SCSS || model.styleSystem === StyleSystem.Tailwind) && !(await fs.pathExists(tplPath))) {
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
