import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'path';

const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
const writeJson = (p: string, data: unknown) => writeFile(p, JSON.stringify(data, null, 2));
const ensureDir = (p: string) => mkdir(p, { recursive: true });
const remove = (p: string) => rm(p, { recursive: true, force: true });

import { runAdd } from '../../cli/commands/add';
import { runAudit } from '../../cli/commands/audit';

vi.spyOn(process, 'exit').mockImplementation((code?: string | number | null | undefined) => {
  throw new Error(`Process exited with code ${code}`);
});
const mockLog = vi.spyOn(console, 'log').mockImplementation(() => {});
vi.spyOn(console, 'error').mockImplementation(() => {});
vi.spyOn(console, 'warn').mockImplementation(() => {});

const TEST_DIR = path.resolve(__dirname, '../../../.audit-test-temp');
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
  runAdd(components, { cwd: TEST_DIR, config: 'crucible.config.json', quiet: true, yes: true, ...opts });

const audit = (components: string[], opts: Record<string, unknown> = {}) =>
  runAudit(components, { cwd: TEST_DIR, config: 'crucible.config.json', json: true, ...opts });

const manifestPath = () => path.join(TEST_DIR, '.crucible', 'manifest.json');
const buttonMain = () => path.join(TEST_DIR, OUT, 'Button', 'Button.tsx');
const lastJson = () => JSON.parse(mockLog.mock.calls.at(-1)![0]);

describe('runAudit', () => {
  beforeEach(async () => {
    await ensureDir(TEST_DIR);
    vi.clearAllMocks();
    process.exitCode = undefined;
  });

  afterEach(async () => {
    await remove(TEST_DIR);
    process.exitCode = undefined;
  });

  it('reports clean and exit 0 right after add', async () => {
    await writeConfig();
    await add(['Button']);
    await audit(['Button']);
    const { counts } = lastJson();
    expect(counts.diverged ?? 0).toBe(0);
    expect(counts.clean).toBeGreaterThan(0);
    expect(process.exitCode).toBeUndefined();
  });

  it('classifies a user-edited file, exit stays 0', async () => {
    await writeConfig();
    await add(['Button']);
    await writeFile(buttonMain(), (await readFile(buttonMain(), 'utf-8')) + '\n// drift\n');
    await audit(['Button']);
    const { counts } = lastJson();
    expect(counts['user-edited']).toBeGreaterThanOrEqual(1);
    expect(process.exitCode).toBeUndefined();
  });

  it('classifies upstream-updated when the stored base is stale but disk matches it', async () => {
    await writeConfig();
    await add(['Button']);
    const key = 'Button/Button.tsx';
    const manifest = await readJson(manifestPath());
    const staleBase = '// stale\n' + manifest.files[key].baseContent;
    manifest.files[key].baseContent = staleBase;
    await writeJson(manifestPath(), manifest);
    await writeFile(buttonMain(), staleBase);

    await audit(['Button']);
    const { counts } = lastJson();
    expect(counts['upstream-updated']).toBeGreaterThanOrEqual(1);
    expect(process.exitCode).toBeUndefined();
  });

  it('classifies diverged (stale base + disk edit) and sets exit code 1', async () => {
    await writeConfig();
    await add(['Button']);
    const key = 'Button/Button.tsx';
    const manifest = await readJson(manifestPath());
    manifest.files[key].baseContent = '// stale\n' + manifest.files[key].baseContent;
    await writeJson(manifestPath(), manifest);
    await writeFile(buttonMain(), '// user edit on top of stale base\n' + (await readFile(buttonMain(), 'utf-8')));

    await audit(['Button']);
    const { counts } = lastJson();
    expect(counts.diverged).toBeGreaterThanOrEqual(1);
    expect(process.exitCode).toBe(1);
  });

  it('reports orphaned for a manifest entry whose component is no longer registered', async () => {
    await writeConfig();
    await add(['Button']);
    const manifest = await readJson(manifestPath());
    manifest.files['GhostComp/Ghost.tsx'] = {
      contentHash: 'x',
      generatedAt: 'now',
      baseContent: 'x',
    };
    await writeJson(manifestPath(), manifest);

    await audit([]);
    const { counts } = lastJson();
    expect(counts.orphaned).toBe(1);
  });

  it('says there is nothing to audit when no components are tracked', async () => {
    await writeConfig();
    await runAudit([], { cwd: TEST_DIR, config: 'crucible.config.json' });
    const out = mockLog.mock.calls.map((c) => c[0]).join('\n');
    expect(out).toContain('No generated components to audit');
  });
});
