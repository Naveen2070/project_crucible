/**
 * Template parity audit.
 *
 * Walks the component × framework × style matrix using the real framework resolvers
 * (the same `FRAMEWORK_TARGETS` the engine uses) and classifies every expected template
 * file as:
 *   - ok       : the template exists in its own framework/style directory
 *   - fallback : missing, but the engine's css-fallback (engine.ts) will cover it
 *                (only valid for scss/tailwind, which fall back to the css/ template)
 *   - MISSING  : no template and no css fallback → generation would emit nothing
 *
 * Exits non-zero only on MISSING (genuinely broken output). Fallbacks are reported as
 * info — they are intentional (e.g. Vue scss/tailwind reuse the css SFC, which chooses
 * its style lang conditionally).
 */
import { existsSync, statSync } from 'node:fs';
import { glob } from 'glob';
import path from 'node:path';
import { FRAMEWORK_TARGETS, FRAMEWORK_STYLE_SYSTEMS } from '../src/registry/frameworks';
import { Framework, StyleSystem } from '../src/core/enums';

const TEMPLATES_ROOT = path.join(__dirname, '..', 'templates');
const FRAMEWORKS = [
  Framework.React,
  Framework.Vue,
  Framework.Angular,
  Framework.ReactNative,
] as const;
// Web frameworks share one component set (parity is enforced across all of them); React Native
// is curated — it audits only the components that actually have react-native templates.
const WEB_FRAMEWORKS = [Framework.React, Framework.Vue, Framework.Angular];

type Status = 'ok' | 'fallback' | 'missing';

/** Union of component directory names found under the given frameworks' style folders. */
async function componentDirsFor(frameworks: string[]): Promise<string[]> {
  const names = new Set<string>();
  for (const fw of frameworks) {
    const dirs = await glob(`templates/${fw}/*/*`, { cwd: path.join(__dirname, '..') });
    for (const rel of dirs) {
      const abs = path.join(__dirname, '..', rel);
      try {
        if (statSync(abs).isDirectory()) names.add(path.basename(rel));
      } catch {
        /* ignore */
      }
    }
  }
  return [...names].sort();
}

function classify(component: string, framework: string, style: string, tpl: string): Status {
  const own = path.join(TEMPLATES_ROOT, framework, style, component, tpl);
  if (existsSync(own)) return 'ok';
  if (style !== StyleSystem.CSS) {
    const fallback = path.join(TEMPLATES_ROOT, framework, StyleSystem.CSS, component, tpl);
    if (existsSync(fallback)) return 'fallback';
  }
  return 'missing';
}

async function auditParity() {
  const webComponents = await componentDirsFor(WEB_FRAMEWORKS);
  const rnComponents = await componentDirsFor([Framework.ReactNative]);
  const counts: Record<string, { ok: number; fallback: number; missing: number }> = {};
  const fallbacks: string[] = [];
  const missing: string[] = [];

  for (const framework of FRAMEWORKS) {
    const resolver = FRAMEWORK_TARGETS[framework];
    const styles = FRAMEWORK_STYLE_SYSTEMS[framework] ?? [];
    const components = framework === Framework.ReactNative ? rnComponents : webComponents;
    for (const style of styles) {
      const key = `${framework}/${style}`;
      counts[key] = { ok: 0, fallback: 0, missing: 0 };
      for (const component of components) {
        for (const target of resolver(component, style)) {
          const status = classify(component, framework, style, target.tpl);
          counts[key][status]++;
          const label = `${framework}/${style}/${component}/${target.tpl}`;
          if (status === 'fallback') fallbacks.push(label);
          else if (status === 'missing') missing.push(label);
        }
      }
    }
  }

  console.log(
    `\nTemplate parity — web: ${webComponents.length} components × ${WEB_FRAMEWORKS.length} frameworks; ` +
      `react-native: ${rnComponents.length} components (per-framework style sets)\n`,
  );
  for (const key of Object.keys(counts)) {
    const c = counts[key];
    const flag = c.missing > 0 ? '❌' : '✅';
    console.log(
      `  ${flag} ${key.padEnd(18)} ok:${c.ok}  fallback:${c.fallback}  missing:${c.missing}`,
    );
  }

  if (fallbacks.length > 0) {
    // Fallbacks are intentional and numerous (scss/tailwind dirs only carry their own
    // style file; ts/html/stories reuse the css template). Summarise rather than dump.
    console.log(
      `\nℹ  ${fallbacks.length} cells covered by css fallback (intentional) — counts per cell above.`,
    );
  }

  if (missing.length > 0) {
    console.error(`\n❌ ${missing.length} MISSING template(s) with no fallback:`);
    for (const m of missing) console.error(`     ${m}`);
    process.exit(1);
  }

  console.log(`\n✅ Template parity OK — no missing templates.\n`);
}

auditParity();
