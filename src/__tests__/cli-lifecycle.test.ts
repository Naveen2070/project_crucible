import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, access, mkdir, rm } from 'node:fs/promises';
import path from 'path';

const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
const writeJson = (p: string, data: unknown) => writeFile(p, JSON.stringify(data, null, 2));
const ensureDir = (p: string) => mkdir(p, { recursive: true });
const remove = (p: string) => rm(p, { recursive: true, force: true });

import { runAdd } from '../cli/commands/add';
import { runList } from '../cli/commands/list';
import { runDoctor } from '../cli/commands/doctor';
import { runInfo } from '../cli/commands/info';
import { runStatus } from '../cli/commands/status';
import { runDiff } from '../cli/commands/diff';
import { runUpdate } from '../cli/commands/update';
import { runRemove } from '../cli/commands/remove';
import { resolveOutputDir, trackedComponents } from '../cli/utils/output-dir';

// Mock process.exit so failures surface as throwable assertions instead of killing the runner.
vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`Process exited with code ${code}`);
});

const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});
const mockWarn = vi.spyOn(console, 'warn').mockImplementation(() => {});

const TEST_DIR = path.resolve(__dirname, '../../.cli-lifecycle-temp');
const OUT = 'src/components';

const fullTokens = {
  color: {
    primary: '#000',
    secondary: '#fff',
    surface: '#fff',
    background: '#fff',
    border: '#fff',
    text: '#000',
    textMuted: '#666',
    destructive: '#f00',
    success: '#0f0',
  },
  radius: { sm: '0', md: '0', lg: '0' },
  spacing: { unit: '1px' },
  typography: { fontFamily: 'serif', scaleBase: '1px' },
};

const writeConfig = (extra: Record<string, unknown> = {}) =>
  writeJson(path.join(TEST_DIR, 'crucible.config.json'), {
    version: '1',
    framework: 'react',
    styleSystem: 'css',
    theme: 'minimal',
    tokens: fullTokens,
    features: { hover: true, focusRing: true, motionSafe: true },
    a11y: {
      focusRingStyle: 'solid',
      focusRingColor: '#000',
      focusRingWidth: '1px',
      focusRingOffset: '0px',
      reduceMotion: true,
    },
    flags: { outputDir: OUT, stories: false },
    ...extra,
  });

const add = (components: string[], opts: Record<string, unknown> = {}) =>
  runAdd(components, {
    cwd: TEST_DIR,
    config: 'crucible.config.json',
    quiet: true,
    yes: true,
    ...opts,
  });

const manifestPath = () => path.join(TEST_DIR, '.crucible', 'manifest.json');
const buttonMain = () => path.join(TEST_DIR, OUT, 'Button', 'Button.tsx');

describe('CLI lifecycle commands', () => {
  beforeEach(async () => {
    await ensureDir(TEST_DIR);
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  afterEach(async () => {
    await remove(TEST_DIR);
    process.exitCode = undefined;
  });

  // ----------------------------------------------------------------- output-dir util
  describe('resolveOutputDir / trackedComponents', () => {
    it('falls back to src/components when no config exists', async () => {
      expect(await resolveOutputDir(TEST_DIR)).toBe('src/components');
    });

    it('reads flags.outputDir from config', async () => {
      await writeConfig({ flags: { outputDir: 'src/ui', stories: false } });
      expect(await resolveOutputDir(TEST_DIR)).toBe('src/ui');
    });

    it('dedupes component names from manifest file keys', () => {
      const files = {
        'Button/Button.tsx': {},
        'Button/Button.module.css': {},
        'Input/Input.tsx': {},
      };
      expect(trackedComponents(files).sort()).toEqual(['Button', 'Input']);
    });
  });

  // ----------------------------------------------------------------- info
  describe('info', () => {
    it('prints metadata as JSON with --json', () => {
      runInfo('Button', { json: true });
      const payload = mockLog.mock.calls.map((c) => c[0]).join('\n');
      const parsed = JSON.parse(payload);
      expect(parsed.id).toBe('Button');
      expect(parsed.variants).toContain('primary');
    });

    it('is case-insensitive on the component name', () => {
      runInfo('button', { json: true });
      const parsed = JSON.parse(mockLog.mock.calls.map((c) => c[0]).join('\n'));
      expect(parsed.id).toBe('Button');
    });

    it('throws for an unknown component', () => {
      expect(() => runInfo('Nope')).toThrow(/Unknown component: Nope/);
    });

    it('suggests the closest match for a near-miss name', () => {
      // suggestions are substring-based: "Butto" is a substring of "Button"
      expect(() => runInfo('Butto')).toThrow(/Did you mean: Button/);
    });

    it('prints a human-readable card without --json', () => {
      runInfo('Button');
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('Button');
      expect(out).toContain('Frameworks');
    });
  });

  // ----------------------------------------------------------------- list --json
  describe('list --json', () => {
    it('emits an array of component descriptors', () => {
      runList({ json: true });
      const arr = JSON.parse(mockLog.mock.calls.map((c) => c[0]).join('\n'));
      expect(Array.isArray(arr)).toBe(true);
      const button = arr.find((c: any) => c.id === 'Button');
      expect(button).toBeDefined();
      expect(button.frameworks).toContain('react');
      expect(button.pluginId).toBe('core');
    });

    it('prints a pretty table without --json', () => {
      runList();
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('Available components:');
      expect(out).toContain('Button');
    });
  });

  // ----------------------------------------------------------------- doctor --json
  describe('doctor --json', () => {
    it('emits a single JSON object and suppresses human output', async () => {
      await writeConfig();
      await runDoctor({ cwd: TEST_DIR, json: true });
      // exactly one console.log payload in JSON mode
      expect(mockLog.mock.calls).toHaveLength(1);
      const parsed = JSON.parse(mockLog.mock.calls[0][0]);
      expect(parsed).toHaveProperty('allPassed');
    });
  });

  // ----------------------------------------------------------------- status
  describe('status', () => {
    it('reports a clean tree immediately after add', async () => {
      await writeConfig();
      await add(['Button']);
      await runStatus({ cwd: TEST_DIR, json: true });
      const report = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(report.summary.ok).toBeGreaterThan(0);
      expect(report.summary.modified).toBe(0);
      expect(report.summary.missing).toBe(0);
      expect(process.exitCode).toBeUndefined();
    });

    it('classifies a user-edited file as modified (still exit 0)', async () => {
      await writeConfig();
      await add(['Button']);
      await writeFile(buttonMain(), (await readFile(buttonMain(), 'utf-8')) + '\n// drift\n');
      await runStatus({ cwd: TEST_DIR, json: true });
      const report = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(report.summary.modified).toBeGreaterThanOrEqual(1);
      // user edits are informational, not a failure
      expect(process.exitCode).toBeUndefined();
    });

    it('flags a missing tracked file and sets a non-zero exit code', async () => {
      await writeConfig();
      await add(['Button']);
      await remove(buttonMain());
      await runStatus({ cwd: TEST_DIR, json: true });
      const report = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(report.summary.missing).toBeGreaterThanOrEqual(1);
      expect(process.exitCode).toBe(1);
    });

    it('detects a stale config and sets a non-zero exit code', async () => {
      await writeConfig();
      await add(['Button']);
      // Mutate the config after generation → configHash no longer matches.
      await writeConfig({ theme: 'soft' });
      await runStatus({ cwd: TEST_DIR, json: true });
      const report = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(report.configStale).toBe(true);
      expect(process.exitCode).toBe(1);
    });

    it('prints a friendly message when nothing is tracked', async () => {
      await writeConfig();
      await runStatus({ cwd: TEST_DIR });
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('No generated components tracked');
    });
  });

  // ----------------------------------------------------------------- diff
  describe('diff', () => {
    it('reports no changes right after add', async () => {
      await writeConfig();
      await add(['Button']);
      await runDiff([], { cwd: TEST_DIR, json: true });
      const { changed } = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(changed).toEqual([]);
    });

    it('detects a modified file', async () => {
      await writeConfig();
      await add(['Button']);
      await writeFile(buttonMain(), (await readFile(buttonMain(), 'utf-8')) + '\n// drift\n');
      await runDiff(['Button'], { cwd: TEST_DIR, json: true });
      const { changed } = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(changed.some((c: any) => c.status === 'modified')).toBe(true);
    });

    it('reports a new file when the on-disk component was removed', async () => {
      await writeConfig();
      await add(['Button']);
      await remove(path.join(TEST_DIR, OUT, 'Button'));
      await runDiff(['Button'], { cwd: TEST_DIR, json: true });
      const { changed } = JSON.parse(mockLog.mock.calls.at(-1)![0]);
      expect(changed.some((c: any) => c.status === 'new')).toBe(true);
    });

    it('says there is nothing to diff when no components are tracked', async () => {
      await writeConfig();
      await runDiff([], { cwd: TEST_DIR });
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('No generated components to diff');
    });
  });

  // ----------------------------------------------------------------- update
  describe('update', () => {
    it('regenerates but preserves user edits without --force', async () => {
      await writeConfig();
      await add(['Button']);
      await writeFile(buttonMain(), (await readFile(buttonMain(), 'utf-8')) + '\n// keep me\n');
      await runUpdate(['Button'], {
        cwd: TEST_DIR,
        config: 'crucible.config.json',
        quiet: true,
        yes: true,
      });
      expect(await readFile(buttonMain(), 'utf-8')).toContain('// keep me');
    });

    it('overwrites user edits with --force', async () => {
      await writeConfig();
      await add(['Button']);
      await writeFile(buttonMain(), '// only this\n');
      await runUpdate(['Button'], {
        cwd: TEST_DIR,
        config: 'crucible.config.json',
        quiet: true,
        yes: true,
        force: true,
      });
      const after = await readFile(buttonMain(), 'utf-8');
      expect(after).not.toBe('// only this\n');
      expect(after).toContain('export const Button');
    });

    it('updates every tracked component when no names are given', async () => {
      await writeConfig();
      await add(['Button', 'Input']);
      mockLog.mockClear();
      await runUpdate([], {
        cwd: TEST_DIR,
        config: 'crucible.config.json',
        quiet: false,
        yes: true,
      });
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('Button');
      expect(out).toContain('Input');
    });

    it('reports nothing to update on an empty project', async () => {
      await writeConfig();
      await runUpdate([], { cwd: TEST_DIR, quiet: false });
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('No generated components to update');
    });
  });

  // ----------------------------------------------------------------- remove
  describe('remove', () => {
    it('deletes the component directory and untracks its files', async () => {
      await writeConfig();
      await add(['Button']);
      await runRemove(['Button'], { cwd: TEST_DIR, yes: true, quiet: true });
      expect(await pathExists(path.join(TEST_DIR, OUT, 'Button'))).toBe(false);
      const manifest = await readJson(manifestPath());
      expect(Object.keys(manifest.files).some((f) => f.startsWith('Button/'))).toBe(false);
    });

    it('is case-insensitive on the component name', async () => {
      await writeConfig();
      await add(['Button']);
      await runRemove(['button'], { cwd: TEST_DIR, yes: true, quiet: true });
      expect(await pathExists(path.join(TEST_DIR, OUT, 'Button'))).toBe(false);
    });

    it('warns when removing a component that others depend on', async () => {
      await writeConfig();
      // Dialog depends on Button; removing Button should warn.
      await add(['Dialog']);
      await runRemove(['Button'], { cwd: TEST_DIR, yes: true });
      const warnings = mockWarn.mock.calls.map((c) => c[0]).join('\n');
      expect(warnings).toContain('Button is a dependency of');
      expect(warnings).toContain('Dialog');
    });

    it('--dry-run leaves files and manifest untouched', async () => {
      await writeConfig();
      await add(['Button']);
      const before = await readJson(manifestPath());
      await runRemove(['Button'], { cwd: TEST_DIR, dryRun: true });
      expect(await pathExists(path.join(TEST_DIR, OUT, 'Button'))).toBe(true);
      const after = await readJson(manifestPath());
      expect(Object.keys(after.files)).toEqual(Object.keys(before.files));
    });

    it('skips a component that was never generated', async () => {
      await writeConfig();
      await add(['Button']);
      await runRemove(['Card'], { cwd: TEST_DIR, yes: true });
      const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
      expect(out).toContain('Card is not generated');
      // Button is untouched.
      expect(await pathExists(path.join(TEST_DIR, OUT, 'Button'))).toBe(true);
    });
  });

  // ----------------------------------------------------------------- --framework override
  describe('add --framework override', () => {
    it('emits framework-specific output for the overridden framework', async () => {
      await writeConfig(); // config framework is react
      await add(['Button'], { framework: 'vue' });
      const manifest = await readJson(manifestPath());
      const keys = Object.keys(manifest.files);
      expect(keys.some((f) => f === 'Button/Button.vue')).toBe(true);
      expect(keys.some((f) => f.endsWith('.tsx'))).toBe(false);
    });
  });
});
