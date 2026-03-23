import { Framework, StyleSystem } from '../core/enums';

export interface ComponentDef {
  frameworks: Framework[];
  styleSystems: StyleSystem[];
  files: {
    css: string[];
    tailwind: string[];
    scss: string[];
  };
  dependencies?: string[];
}

const ALL_FRAMEWORKS = [Framework.React, Framework.Angular, Framework.Vue] as const;
const ALL_STYLE_SYSTEMS = [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS] as const;

function getModuleExt(styleSystem: StyleSystem): string {
  switch (styleSystem) {
    case StyleSystem.SCSS:
      return '.module.scss';
    case StyleSystem.CSS:
      return '.module.css';
    case StyleSystem.Tailwind:
      return '';
  }
}

function getComponentExt(framework: Framework): string {
  switch (framework) {
    case Framework.React:
      return '.tsx';
    case Framework.Vue:
      return '.vue';
    case Framework.Angular:
      return '.component.ts';
  }
}

function getStoriesExt(framework: Framework): string {
  switch (framework) {
    case Framework.React:
      return '.stories.tsx';
    case Framework.Vue:
    case Framework.Angular:
      return '.stories.ts';
  }
}

function generateFrameworkFiles(
  name: string,
  styleSystem: StyleSystem,
  framework: Framework,
): string[] {
  const pascal = name;
  const kebab = name.toLowerCase();
  const componentExt = getComponentExt(framework);
  const storiesExt = getStoriesExt(framework);
  const moduleExt = getModuleExt(styleSystem);
  const styleExt = styleSystem === StyleSystem.SCSS ? '.scss' : '.css';

  const files: string[] = [];

  if (framework === Framework.Angular) {
    files.push(`${kebab}/${kebab}${componentExt}`);
    files.push(`${kebab}/${kebab}.component.html`);
    files.push(`${kebab}/${kebab}.component${styleExt}`);
    files.push(`${kebab}/${kebab}${storiesExt}`);
    files.push(`${kebab}/README.md`);
  } else {
    files.push(`${pascal}/${pascal}${componentExt}`);

    if (styleSystem !== StyleSystem.Tailwind) {
      files.push(`${pascal}/${pascal}${moduleExt}`);
    }

    files.push(`${pascal}/${pascal}${storiesExt}`);
    files.push(`${pascal}/README.md`);
  }

  return files;
}

function generateFilesForStyle(name: string, styleSystem: StyleSystem): string[] {
  const files: string[] = [];

  for (const framework of ALL_FRAMEWORKS) {
    files.push(...generateFrameworkFiles(name, styleSystem, framework));
  }

  return files;
}

export function generateComponentFiles(name: string, dependencies?: string[]): ComponentDef {
  return {
    frameworks: [...ALL_FRAMEWORKS],
    styleSystems: [...ALL_STYLE_SYSTEMS],
    files: {
      css: generateFilesForStyle(name, StyleSystem.CSS),
      tailwind: generateFilesForStyle(name, StyleSystem.Tailwind),
      scss: generateFilesForStyle(name, StyleSystem.SCSS),
    },
    dependencies,
  };
}
