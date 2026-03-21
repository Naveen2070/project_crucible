import { Framework, StyleSystem } from '../core/enums';

export interface FileTarget {
  tpl: string;
  out: string;
  isStory?: boolean;
}

export const FRAMEWORK_TARGETS: Record<Framework, (name: string, styleSystem: StyleSystem) => FileTarget[]> = {
  [Framework.React]: (name, styleSystem) => {
    const targets: FileTarget[] = [{ tpl: `${name}.tsx.hbs`, out: `${name}.tsx` }];
    if (styleSystem === StyleSystem.CSS) {
      targets.push({ tpl: `${name}.module.css.hbs`, out: `${name}.module.css` });
    } else if (styleSystem === StyleSystem.SCSS) {
      targets.push({ tpl: `${name}.module.scss.hbs`, out: `${name}.module.scss` });
    }
    targets.push({ tpl: `${name}.stories.tsx.hbs`, out: `${name}.stories.tsx`, isStory: true });
    return targets;
  },
  [Framework.Angular]: (name, styleSystem) => {
    const kebabName = name.toLowerCase();
    const targets: FileTarget[] = [
      { tpl: `${kebabName}.component.ts.hbs`, out: `${kebabName}.component.ts` },
      { tpl: `${kebabName}.component.html.hbs`, out: `${kebabName}.component.html` },
    ];
    if (styleSystem === StyleSystem.CSS) {
      targets.push({ tpl: `${kebabName}.component.css.hbs`, out: `${kebabName}.component.css` });
    } else if (styleSystem === StyleSystem.SCSS) {
      targets.push({ tpl: `${kebabName}.component.scss.hbs`, out: `${kebabName}.component.scss` });
    }
    targets.push({ tpl: `${kebabName}.stories.ts.hbs`, out: `${kebabName}.stories.ts`, isStory: true });
    return targets;
  },
  [Framework.Vue]: (name) => {
    return [
      { tpl: `${name}.vue.hbs`, out: `${name}.vue` },
      { tpl: `${name}.stories.ts.hbs`, out: `${name}.stories.ts`, isStory: true },
    ];
  },
};
