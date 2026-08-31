import { readFile } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { loadHashes, hashContent } from '../../scaffold/writer';
import { getEngineVersion } from '../../components/model';
import { pathExists } from '../../utils/fs';
import { resolveOutputDir } from '../utils/output-dir';
import { readConfig } from '../../config/reader';
import { classifyTree } from '../../migrate/report';
import { Framework } from '../../core/enums';

export interface StatusOptions {
  json?: boolean;
  cwd?: string;
  config?: string;
}

type FileState = 'ok' | 'modified' | 'missing';

interface StatusReport {
  outputDir: string;
  engineVersion: string;
  manifestEngineVersion: string;
  engineStale: boolean;
  configStale: boolean;
  files: { file: string; state: FileState }[];
  summary: { ok: number; modified: number; missing: number };
  /** Merge-aware counts (D2 taxonomy) — omitted if the config couldn't be read/rendered. */
  merge?: { diverged: number; upstreamUpdated: number; orphaned: number };
}

export async function runStatus(opts: StatusOptions = {}) {
  const cwd = opts.cwd || process.cwd();
  const manifest = await loadHashes(cwd);
  const outputDir = await resolveOutputDir(cwd);
  const outDir = path.join(cwd, outputDir);

  const engineVersion = getEngineVersion();
  const engineStale = !!manifest.engineVersion && manifest.engineVersion !== engineVersion;

  let configStale = false;
  const configPath = path.join(cwd, 'crucible.config.json');
  if (manifest.configHash && (await pathExists(configPath))) {
    const currentConfigHash = hashContent(await readFile(configPath, 'utf-8'));
    configStale = currentConfigHash !== manifest.configHash;
  }

  const files: { file: string; state: FileState }[] = [];
  for (const [hashKey, meta] of Object.entries(manifest.files)) {
    const filePath = path.join(outDir, hashKey);
    if (!(await pathExists(filePath))) {
      files.push({ file: hashKey, state: 'missing' });
      continue;
    }
    const currentHash = hashContent(await readFile(filePath, 'utf-8'));
    files.push({ file: hashKey, state: currentHash === meta.contentHash ? 'ok' : 'modified' });
  }

  const summary = {
    ok: files.filter((f) => f.state === 'ok').length,
    modified: files.filter((f) => f.state === 'modified').length,
    missing: files.filter((f) => f.state === 'missing').length,
  };

  // Best-effort merge-aware counts. Requires rendering every tracked component (heavier than the
  // hash-only check above), so failures here (missing/invalid config, unresolvable component)
  // must never break the cheap ok/modified/missing report status already provides.
  let merge: StatusReport['merge'];
  if (Object.keys(manifest.files).length > 0) {
    try {
      const configRel = path.relative(
        process.cwd(),
        path.join(cwd, opts.config || 'crucible.config.json'),
      );
      const config = await readConfig(configRel);
      const classification = await classifyTree({
        cwd,
        outDir,
        config,
        framework: config.framework as Framework,
        generateStories: config.flags?.stories ?? false,
        manifest,
      });
      merge = {
        diverged: classification.counts.diverged ?? 0,
        upstreamUpdated: classification.counts['upstream-updated'] ?? 0,
        orphaned: classification.counts.orphaned ?? 0,
      };
    } catch {
      // Half-set-up project (no config yet, etc.) — status stays usable without merge counts.
    }
  }

  const report: StatusReport = {
    outputDir,
    engineVersion,
    manifestEngineVersion: manifest.engineVersion || '',
    engineStale,
    configStale,
    files,
    summary,
    merge,
  };

  // Stale config/engine or missing files are actionable failures; user edits are informational.
  const failed = engineStale || configStale || summary.missing > 0;

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
    if (failed) process.exitCode = 1;
    return;
  }

  if (Object.keys(manifest.files).length === 0) {
    console.log(ansis.gray('No generated components tracked. Run `crucible add <Component>` first.'));
    return;
  }

  console.log(ansis.cyan(`\n⚗  Crucible Status — ${outputDir}\n`));

  if (configStale) {
    console.log(ansis.yellow('⚠ Config has changed since generation — components may be stale.'));
  }
  if (engineStale) {
    console.log(
      ansis.yellow(
        `⚠ Engine updated (${manifest.engineVersion} → ${engineVersion}) — regenerate to pick up template changes.`,
      ),
    );
  }

  const icon: Record<FileState, string> = {
    ok: ansis.green('✓'),
    modified: ansis.yellow('±'),
    missing: ansis.red('✗'),
  };
  for (const f of files) {
    console.log(`  ${icon[f.state]}  ${f.state === 'ok' ? ansis.gray(f.file) : f.file}`);
  }

  console.log(
    `\n  ${ansis.green(`${summary.ok} ok`)}, ${ansis.yellow(`${summary.modified} modified`)}, ${ansis.red(`${summary.missing} missing`)}`,
  );
  if (merge && (merge.diverged > 0 || merge.upstreamUpdated > 0 || merge.orphaned > 0)) {
    console.log(
      ansis.gray(
        `  (${merge.diverged} diverged, ${merge.upstreamUpdated} upstream-updated, ${merge.orphaned} orphaned — run \`crucible audit\` for details)`,
      ),
    );
  }
  if (summary.modified > 0) {
    console.log(ansis.gray('  Modified files are user-edited; `crucible add <C> --force` overwrites them.'));
  }
  if (configStale || engineStale || summary.missing > 0) {
    console.log(ansis.gray('  Run `crucible update` to regenerate (preserves your edits).'));
  }
  console.log('');

  if (failed) process.exitCode = 1;
}
