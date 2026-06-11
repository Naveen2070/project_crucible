import { CrucibleConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderComponent, renderGlobalTokens } from '../templates/engine';
import { Framework } from '../core/enums';
import { checkComponentDependencies, getComponentDefinition } from '../cli/utils/deps';
import { pluginRegistry } from '../plugins/registry';

/**
 * Pure component-generation core.
 *
 * `generate()` resolves dependencies and renders component + token sources entirely in memory.
 * It performs NO console output, NO `process.exit`, and NO interactive prompts — callers
 * (the `add` command, `update`, `diff`, the TUI wizard) own all I/O and reporting. It throws
 * on error so callers can decide how to surface it.
 */
export interface GenerateRequest {
  /** Components the user explicitly asked for (already normalized/capitalized). */
  components: string[];
  /** Project root — used for relative dependency-existence checks. */
  cwd: string;
  /** Where components are (or will be) written — used to detect already-generated deps. */
  outDir: string;
  config: CrucibleConfig;
  /**
   * Framework used for dependency/peer-dependency existence checks (honours the CLI
   * `--framework` override). Note: the rendered output itself follows `config.framework`
   * via `buildComponentModel`, matching the existing `add` behaviour.
   */
  framework: Framework;
  generateStories: boolean;
  /** Vue only: emit native `useId()` (Vue 3.5+) vs the deprecated fallback. */
  vueUseId?: boolean;
}

export interface GeneratedComponent {
  name: string;
  pluginId: string;
  /** filename → rendered (un-formatted) source. */
  files: Record<string, string>;
  /** Manifest `utils` the rendered files actually import (`./utils/<name>`). */
  usedUtils: string[];
}

export interface GenerateResult {
  components: GeneratedComponent[];
  /** Input components plus any auto-added dependencies. */
  resolvedComponents: string[];
  /** Missing peer dependencies across the resolved set (deduped, in first-seen order). */
  peerDependencies: string[];
  /** Rendered global tokens.css source — callers decide whether/when to write it. */
  tokens: { content: string };
}

export async function generate(req: GenerateRequest): Promise<GenerateResult> {
  const { components, outDir, config, framework, generateStories } = req;
  const vueUseId = req.vueUseId ?? true;

  const tokens = resolveTokens(config);

  // Resolve transitive component dependencies + collect missing peer dependencies.
  // (Behaviour preserved verbatim from the original `runAdd`.)
  const resolvedComponents = new Set<string>(components);
  const peerDependencies: string[] = [];

  for (const comp of components) {
    const def = getComponentDefinition(comp);
    if (def?.dependencies) {
      for (const dep of def.dependencies) {
        const exists = await checkComponentDependencies(dep, outDir, framework);
        if (exists.missingComponents.includes(dep) && !resolvedComponents.has(dep)) {
          resolvedComponents.add(dep);
        }
      }
    }

    const check = await checkComponentDependencies(comp, outDir, framework);
    for (const peerDep of check.missingPeerDeps) {
      if (!peerDependencies.includes(peerDep)) {
        peerDependencies.push(peerDep);
      }
    }
  }

  const generatedComponents: GeneratedComponent[] = await Promise.all(
    Array.from(resolvedComponents).map(async (comp) => {
      const model = buildComponentModel(comp, tokens, config, generateStories, vueUseId);
      const files = await renderComponent(model);

      // Only ship utils the generated files actually import — a manifest util may be used by
      // some frameworks but not others (e.g. roving-focus: React DropdownMenu uses floating-ui).
      const usedUtils = (model.utils ?? []).filter((u) =>
        Object.values(files).some((content) => content.includes(`./utils/${u}`)),
      );

      const pluginId = pluginRegistry.getComponentPluginId(comp) || 'core';
      return { name: comp, pluginId, files, usedUtils };
    }),
  );

  const tokenModel = buildComponentModel('Button', tokens, config, generateStories);
  const tokensContent = await renderGlobalTokens(tokenModel);

  return {
    components: generatedComponents,
    resolvedComponents: Array.from(resolvedComponents),
    peerDependencies,
    tokens: { content: tokensContent },
  };
}
