import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'path';
import { loadPlugins } from '../plugins/loader';
import { pluginRegistry } from '../plugins/registry';
import { LoadedPlugin } from '../plugins/types';
import { registry } from '../registry/components';
import { COMPONENT_DEFAULTS } from '../registry/manifests/defaults';

/**
 * Plug-and-play verification.
 *
 * Exercises the data-driven plugin pipeline end-to-end at the registry layer:
 *   loadPlugins() discovery + semver gating  →  PluginRegistry registration
 *   →  registry / COMPONENT_DEFAULTS proxies surfacing plugin components.
 *
 * A throwaway fixture is materialised under .plugins-test-temp/.crucible/plugins
 * mirroring the real local-plugin layout (.crucible/plugins/<name>/plugin.json).
 */

const TEST_DIR = path.join(__dirname, '../../.plugins-test-temp');
const PLUGINS_DIR = path.join(TEST_DIR, '.crucible/plugins');

const ensureDir = (p: string) => mkdir(p, { recursive: true });
const remove = (p: string) => rm(p, { recursive: true, force: true });
const writeJson = (p: string, data: unknown) => writeFile(p, JSON.stringify(data, null, 2));

// A complete, valid local plugin providing one brand-new component.
const DEMO_ROOT = path.join(PLUGINS_DIR, 'demo-plugin');
// An incompatible plugin that must be filtered out by the semver gate.
const FUTURE_ROOT = path.join(PLUGINS_DIR, 'future-plugin');
// A plugin with corrupt JSON that must not crash discovery.
const BROKEN_ROOT = path.join(PLUGINS_DIR, 'broken-plugin');
// A directory with no plugin.json that must be ignored.
const EMPTY_ROOT = path.join(PLUGINS_DIR, 'not-a-plugin');

beforeAll(async () => {
  await remove(TEST_DIR);

  // --- demo-plugin: well-formed, compatible ---
  await ensureDir(path.join(DEMO_ROOT, 'components'));
  await ensureDir(path.join(DEMO_ROOT, 'templates/react/css/Widget'));
  await writeJson(path.join(DEMO_ROOT, 'plugin.json'), {
    id: 'demo-plugin',
    name: 'Demo Plugin',
    version: '0.1.0',
    engineVersion: '>=1.0.0',
    description: 'Fixture plugin for plug-and-play tests',
    components: ['components/widget.json'],
    templatesDir: './templates',
  });
  await writeJson(path.join(DEMO_ROOT, 'components/widget.json'), {
    id: 'Widget',
    name: 'Widget',
    description: 'A demo plugin component',
    frameworks: ['react', 'vue', 'angular'],
    styleSystems: ['css', 'scss', 'tailwind'],
    variants: ['default'],
    sizes: [],
    states: [],
    props: [],
    prefix: 'widget',
    tailwindDefaults: { default: 'inline-flex items-center' },
  });

  // --- future-plugin: incompatible engineVersion (must be skipped) ---
  await ensureDir(path.join(FUTURE_ROOT, 'components'));
  await writeJson(path.join(FUTURE_ROOT, 'plugin.json'), {
    id: 'future-plugin',
    name: 'Future Plugin',
    version: '1.0.0',
    engineVersion: '>=99.0.0',
    components: ['components/ghost.json'],
  });
  await writeJson(path.join(FUTURE_ROOT, 'components/ghost.json'), {
    id: 'GhostComp',
    name: 'GhostComp',
    frameworks: ['react'],
    styleSystems: ['css'],
    variants: [],
    sizes: [],
    states: [],
    props: [],
    prefix: 'ghost',
  });

  // --- broken-plugin: invalid JSON (must not crash loadPlugins) ---
  await ensureDir(BROKEN_ROOT);
  await writeFile(path.join(BROKEN_ROOT, 'plugin.json'), '{ this is not valid json ');

  // --- not-a-plugin: directory without a manifest (must be ignored) ---
  await ensureDir(EMPTY_ROOT);
  await writeFile(path.join(EMPTY_ROOT, 'README.md'), 'no manifest here');
});

afterAll(async () => {
  await remove(TEST_DIR);
});

describe('Plug-and-play: loadPlugins discovery', () => {
  it('discovers a well-formed local plugin from .crucible/plugins', async () => {
    const plugins = await loadPlugins(TEST_DIR);
    const demo = plugins.find((p) => p.manifest.id === 'demo-plugin');

    expect(demo).toBeDefined();
    expect(demo!.manifest.version).toBe('0.1.0');
    expect(demo!.root).toBe(DEMO_ROOT);
  });

  it('loads the plugin\'s component manifests with their declared metadata', async () => {
    const plugins = await loadPlugins(TEST_DIR);
    const demo = plugins.find((p) => p.manifest.id === 'demo-plugin')!;

    expect(demo.components).toHaveLength(1);
    const widget = demo.components[0];
    expect(widget.id).toBe('Widget');
    expect(widget.prefix).toBe('widget');
    expect(widget.frameworks).toContain('react');
    expect(widget.styleSystems).toEqual(['css', 'scss', 'tailwind']);
  });

  it('still loads the built-in core plugin alongside local plugins', async () => {
    const plugins = await loadPlugins(TEST_DIR);
    // The core plugin contributes the foundational components.
    const allComponentIds = plugins.flatMap((p) => p.components.map((c) => c.id));
    expect(allComponentIds).toContain('Button');
    expect(allComponentIds).toContain('Widget');
  });

  it('skips plugins whose engineVersion is incompatible', async () => {
    const plugins = await loadPlugins(TEST_DIR);
    expect(plugins.find((p) => p.manifest.id === 'future-plugin')).toBeUndefined();
    const allComponentIds = plugins.flatMap((p) => p.components.map((c) => c.id));
    expect(allComponentIds).not.toContain('GhostComp');
  });

  it('is resilient to a malformed plugin.json (does not throw, skips it)', async () => {
    // The broken/empty fixtures are already present; discovery must not reject.
    const plugins = await loadPlugins(TEST_DIR);
    expect(Array.isArray(plugins)).toBe(true);
    expect(plugins.find((p) => p.manifest.id === 'broken-plugin')).toBeUndefined();
  });
});

describe('Plug-and-play: registration & resolution', () => {
  it('registers a loaded plugin component and resolves it through the registry', async () => {
    const plugins = await loadPlugins(TEST_DIR);
    const demo = plugins.find((p) => p.manifest.id === 'demo-plugin')!;
    pluginRegistry.registerPlugin(demo);

    expect(pluginRegistry.getComponentDef('Widget')).toBeDefined();
    expect(pluginRegistry.getComponentManifest('Widget')?.prefix).toBe('widget');
    expect(pluginRegistry.getComponentPluginId('Widget')).toBe('demo-plugin');
    expect(pluginRegistry.getAllComponentIds()).toContain('Widget');
  });

  it('resolves the component templates dir relative to the plugin root', () => {
    const dir = pluginRegistry.getComponentTemplatesDir('Widget');
    expect(dir).toBeDefined();
    expect(path.isAbsolute(dir!)).toBe(true);
    expect(dir).toBe(path.join(DEMO_ROOT, 'templates'));
  });

  it('exposes plugin tailwind defaults', () => {
    const tw = pluginRegistry.getTailwindDefaults();
    expect(tw['Widget']).toEqual({ default: 'inline-flex items-center' });
  });

  it('surfaces the plugin component through the registry / COMPONENT_DEFAULTS proxies', () => {
    // These proxies are what the CLI (add) and model builder read from.
    expect(registry['Widget']).toBeDefined();
    expect(COMPONENT_DEFAULTS['Widget']).toBeDefined();
    expect(COMPONENT_DEFAULTS['Widget'].prefix).toBe('widget');
    expect(Object.keys(registry)).toContain('Widget');
  });

  it('lets a later plugin override an existing component id (last write wins)', () => {
    const overridePlugin: LoadedPlugin = {
      manifest: {
        id: 'override-plugin',
        name: 'Override Plugin',
        version: '1.0.0',
        components: [],
      },
      root: DEMO_ROOT,
      components: [
        {
          id: 'Widget',
          name: 'Widget',
          frameworks: ['react'] as any,
          styleSystems: ['css'] as any,
          variants: [],
          sizes: [],
          states: [],
          props: [],
          prefix: 'widget-overridden',
        },
      ],
    };
    pluginRegistry.registerPlugin(overridePlugin);

    expect(pluginRegistry.getComponentManifest('Widget')?.prefix).toBe('widget-overridden');
    expect(pluginRegistry.getComponentPluginId('Widget')).toBe('override-plugin');
  });
});
