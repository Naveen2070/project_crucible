import { Framework, StyleSystem } from '../core/enums';
import { pluginRegistry, FileTarget, FrameworkResolver } from '../plugins/registry';

export type { FileTarget };

/**
 * Valid style systems per framework — the single source of truth that replaces the old assumption
 * that every framework supports every style. Web frameworks support the CSS family; React Native
 * supports NativeWind (Tailwind classNames) and the built-in StyleSheet. Consumed by the parity
 * audit, the CLI style validation, and the framework manifests.
 */
export const FRAMEWORK_STYLE_SYSTEMS: Record<string, StyleSystem[]> = {
  [Framework.React]: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
  [Framework.Vue]: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
  [Framework.Angular]: [StyleSystem.CSS, StyleSystem.Tailwind, StyleSystem.SCSS],
  [Framework.ReactNative]: [StyleSystem.NativeWind, StyleSystem.StyleSheet],
};

/**
 * Platform intent (see `ComponentManifest.platforms`): missing → cross-platform (web+ios+android).
 * `isMobileEligible` decides whether a component belongs in a React Native picker;
 * `platformLabel` renders the intent as a short human-readable tag for `list`/`info`/the TUI.
 */
export function isMobileEligible(platforms?: string[]): boolean {
  return !platforms || platforms.includes('ios') || platforms.includes('android');
}

export function platformLabel(platforms?: string[]): string {
  const list = platforms ?? ['android', 'ios', 'web'];
  if (list.length === 1 && list[0] === 'web') return 'Web only';
  const order: Record<string, string> = { android: 'Android', ios: 'iOS', web: 'Web' };
  return Object.keys(order)
    .filter((p) => list.includes(p))
    .map((p) => order[p])
    .join(' · ');
}

export const FRAMEWORK_TARGETS: Record<string, FrameworkResolver> = {
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
  // React Native. Both styles (nativewind / stylesheet) emit the same filenames; the engine
  // selects the template from templates/react-native/<styleSystem>/<Component>/. There is no
  // CSS fallback for RN, so each style dir carries its own .tsx + stories template.
  [Framework.ReactNative]: (name) => {
    return [
      { tpl: `${name}.tsx.hbs`, out: `${name}.tsx` },
      { tpl: `${name}.stories.tsx.hbs`, out: `${name}.stories.tsx`, isStory: true },
    ];
  },
};

// Register built-in framework resolvers
for (const [id, resolver] of Object.entries(FRAMEWORK_TARGETS)) {
  pluginRegistry.registerFrameworkResolver(id, resolver);
}
