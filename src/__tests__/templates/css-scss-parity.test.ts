import { describe, test, expect } from 'vitest';
import * as sass from 'sass';
import postcss from 'postcss';
import { buildComponentModel } from '../../components/model';
import { resolveTokens } from '../../tokens/resolver';
import { renderComponent } from '../../templates/engine';
import { Framework, ThemePreset, StyleSystem, ComponentName } from '../../core/enums';

/**
 * Drift guard for the hand-maintained css-module and scss-module style templates.
 *
 * The component `.tsx` / `.component.ts` files are SHARED across css and scss (the scss
 * dir only carries its own style module). They reference style classes by name
 * (`styles.cellBordered`, `[class.foo]`). So the invariant that actually matters is:
 *
 *   the SET of class names defined by the css module === the set defined by the scss module
 *
 * If they drift (e.g. css `.cellBordered` vs scss `&-bordered` → `.cell-bordered`), the
 * shared component references a class the stylesheet doesn't define and styling silently
 * breaks. We render both, compile the scss to flat css, extract the class-name set from
 * each, and compare.
 *
 * Why class-name SETS rather than full-rule equivalence: scss nesting legitimately changes
 * selector *structure* (compound-class ordering, added specificity like `.content.size-lg`
 * vs `.size-lg`, comma-group splitting) without changing which classes exist. Comparing
 * full selectors produces false positives on all of those; comparing the class-token set
 * does not, while still catching real class-name drift.
 *
 * Vue is excluded: its style lives in the SFC (one template, style lang chosen
 * conditionally), so there is no separate css/scss pair to compare.
 */
const FRAMEWORKS = [Framework.React, Framework.Angular] as const;
const COMPONENTS = Object.values(ComponentName);

const baseConfig = (framework: string, styleSystem: string) =>
  ({
    framework,
    theme: ThemePreset.Minimal,
    styleSystem,
    tokens: {
      color: { primary: '#6C63FF', surface: '#fff' },
      radius: { md: '8px' },
      spacing: { unit: '4px' },
      typography: { scaleBase: '16px' },
    },
    features: { hover: true, focusRing: true, motionSafe: true },
    a11y: {
      focusRingColor: 'var(--color-primary)',
      focusRingWidth: '2px',
      focusRingOffset: '3px',
      reduceMotion: true,
    },
  }) as any;

async function renderComponentStyle(framework: string, component: string, styleSystem: string) {
  const config = baseConfig(framework, styleSystem);
  const model = buildComponentModel(component, resolveTokens(config), config, false);
  const out = await renderComponent(model);
  const ext = styleSystem === StyleSystem.SCSS ? 'scss' : 'css';
  const key = Object.keys(out).find((k) => k.endsWith(`.module.${ext}`) || k.endsWith(`.component.${ext}`));
  return key ? out[key] : null;
}

/** Extract the set of class names defined by any non-empty rule in a flat CSS string. */
function classNames(css: string): Set<string> {
  const root = postcss.parse(css);
  const names = new Set<string>();
  root.walkRules((rule) => {
    // Comment-only / empty rules (e.g. `.variant-default { /* uses defaults */ }`) survive
    // in plain CSS but are dropped when sass compiles the scss — ignore them.
    let hasDecl = false;
    rule.walkDecls(() => {
      hasDecl = true;
    });
    if (!hasDecl) return;
    // Class tokens only (`.foo`); ignore pseudo-classes, attributes, :root, :host, etc.
    const matches = rule.selector.match(/\.[A-Za-z_][A-Za-z0-9_-]*/g) ?? [];
    for (const m of matches) names.add(m.slice(1));
  });
  return names;
}

describe('CSS/SCSS template parity', () => {
  describe.each(FRAMEWORKS)('Framework: %s', (framework) => {
    test.each(COMPONENTS)('%s css and scss define the same class names', async (component) => {
      const cssOut = await renderComponentStyle(framework, component, StyleSystem.CSS);
      const scssOut = await renderComponentStyle(framework, component, StyleSystem.SCSS);

      // Both frameworks emit a dedicated style module for every component.
      expect(cssOut, `${component} css style missing`).toBeTruthy();
      expect(scssOut, `${component} scss style missing`).toBeTruthy();

      const compiledScss = sass.compileString(scssOut as string, { style: 'expanded' }).css;

      const cssClasses = [...classNames(cssOut as string)].sort();
      const scssClasses = [...classNames(compiledScss)].sort();

      expect(scssClasses, `${component} scss class names drifted from css`).toEqual(cssClasses);
    });
  });
});
