import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'path';
import { runCompletion } from '../cli/commands/completion';
import { runInfo } from '../cli/commands/info';
import { getEngineVersion, configVersionHint } from '../cli/utils/config-version';
import { writeFiles } from '../scaffold/writer';

const TEST_DIR = path.resolve(__dirname, '../../.cli-dx-test-temp');

// Capture stdout writes (completion prints scripts/components via process.stdout.write).
let stdoutChunks: string[] = [];
vi.spyOn(process.stdout, 'write').mockImplementation(((chunk: any) => {
  stdoutChunks.push(String(chunk));
  return true;
}) as any);

const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
const mockError = vi.spyOn(console, 'error').mockImplementation(() => {});

const stdout = () => stdoutChunks.join('');
const logged = () => mockLog.mock.calls.map((c) => c.join(' ')).join('\n');

beforeEach(() => {
  stdoutChunks = [];
  vi.clearAllMocks();
});

describe('completion command', () => {
  it('prints a bash completion script', () => {
    runCompletion('bash');
    expect(stdout()).toContain('_crucible_completion');
    expect(stdout()).toContain('complete -F _crucible_completion crucible');
  });

  it('prints a zsh completion script with a valid component-command case', () => {
    runCompletion('zsh');
    expect(stdout()).toContain('#compdef crucible');
    // The case alternation must be pipe-joined (regression guard for the JS template bug).
    expect(stdout()).toContain('add|a|info|remove|rm|diff|update|up)');
  });

  it('prints a fish completion script', () => {
    runCompletion('fish');
    expect(stdout()).toContain('__fish_use_subcommand');
  });

  it('lists component ids in --components mode (e.g. Button)', () => {
    runCompletion(undefined, { components: true });
    expect(stdout()).toContain('Button');
  });

  it('prints usage help to stderr for an unknown/missing shell (never to stdout)', () => {
    runCompletion('powershell');
    expect(stdout()).toBe('');
    expect(mockError).toHaveBeenCalledWith(expect.stringContaining('crucible completion'));
  });
});

describe('info --deps-tree', () => {
  it('renders a dependency tree showing a component and its dependency', () => {
    // Dialog depends on Button in the core registry.
    runInfo('Dialog', { depsTree: true });
    const out = logged();
    expect(out).toContain('Dialog');
    expect(out).toContain('Button');
    expect(out).toContain('└── ');
  });

  it('emits JSON deps when --deps-tree is combined with --json', () => {
    runInfo('Dialog', { depsTree: true, json: true });
    const out = logged();
    expect(out).toContain('"dependencies"');
  });
});

describe('config-version hint', () => {
  it('flags an older config version', () => {
    const hint = configVersionHint('1.0.0', '1.2.0');
    expect(hint).toMatch(/older than Crucible v1\.2\.0/);
  });

  it('returns null for current or newer config versions and when unset', () => {
    expect(configVersionHint('1.2.0', '1.2.0')).toBeNull();
    expect(configVersionHint('2.0.0', '1.2.0')).toBeNull();
    expect(configVersionHint(undefined, '1.2.0')).toBeNull();
  });

  it('reads a concrete engine version from the package manifest', async () => {
    const v = await getEngineVersion();
    expect(v).toMatch(/^\d+\.\d+\.\d+/);
  });
});

describe('writeFiles result contract (drives the warnings summary)', () => {
  beforeEach(async () => {
    await mkdir(TEST_DIR, { recursive: true });
  });
  afterEach(async () => {
    await rm(TEST_DIR, { recursive: true, force: true });
  });

  it('reports written files on a fresh write and no skips', async () => {
    const res = await writeFiles({ 'Demo.tsx': 'export const Demo = 1;' }, TEST_DIR, 'Demo', {
      cwd: TEST_DIR,
      quiet: true,
    });
    expect(res.component).toBe('Demo');
    expect(res.written).toContain('Demo/Demo.tsx');
    expect(res.skipped).toEqual([]);
  });

  it('reports a user-edited file as skipped (preserved) on re-write without --force', async () => {
    const files = { 'Demo.tsx': 'export const Demo = 1;' };
    await writeFiles(files, TEST_DIR, 'Demo', { cwd: TEST_DIR, quiet: true });

    // Simulate a user edit on disk, then regenerate the original content without --force.
    await writeFile(path.join(TEST_DIR, 'Demo', 'Demo.tsx'), 'export const Demo = 999; // edited');
    const res = await writeFiles(files, TEST_DIR, 'Demo', { cwd: TEST_DIR, quiet: true });

    expect(res.skipped).toContain('Demo/Demo.tsx');
    expect(res.written).toEqual([]);
  });
});
