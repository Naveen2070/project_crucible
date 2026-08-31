import path from 'path';
import ansis from 'ansis';
import { readConfig } from '../../config/reader';
import { loadHashes } from '../../scaffold/writer';
import { resolveOutputDir } from '../utils/output-dir';
import { classifyTree, ReportFileState } from '../../migrate/report';
import { Framework, StyleSystem } from '../../core/enums';

export interface AuditOptions {
  framework?: string;
  style?: string;
  stories?: boolean;
  json?: boolean;
  /** Also fail (nonzero exit) when anything is out of date at all, not just `diverged`. */
  strict?: boolean;
  cwd?: string;
  config?: string;
}

const ICON: Record<ReportFileState, string> = {
  clean: ansis.gray('✓'),
  'upstream-updated': ansis.cyan('↑'),
  'user-edited': ansis.yellow('✎'),
  diverged: ansis.red('⚠'),
  orphaned: ansis.magenta('?'),
  new: ansis.green('+'),
};

const LABEL: Record<ReportFileState, string> = {
  clean: 'clean',
  'upstream-updated': 'upstream updated',
  'user-edited': 'user edited',
  diverged: 'diverged',
  orphaned: 'orphaned',
  new: 'new',
};

function capitalizeFirst(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

export async function runAudit(components: string[], opts: AuditOptions = {}) {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.');
  const configRel = path.relative(
    process.cwd(),
    path.join(cwd, opts.config || 'crucible.config.json'),
  );
  const config = await readConfig(configRel);
  if (opts.style) config.styleSystem = opts.style as StyleSystem;
  const framework = (opts.framework as Framework) || (config.framework as Framework);
  const generateStories = opts.stories ?? config.flags?.stories ?? false;

  const manifest = await loadHashes(cwd);
  const outputDir = await resolveOutputDir(cwd);
  const outDir = path.join(cwd, outputDir);

  const report = await classifyTree({
    cwd,
    outDir,
    config,
    framework,
    generateStories,
    manifest,
    components: components && components.length > 0 ? components.map(capitalizeFirst) : undefined,
  });

  const diverged = report.counts.diverged ?? 0;
  const orphaned = report.counts.orphaned ?? 0;
  const upstreamUpdated = report.counts['upstream-updated'] ?? 0;

  const failed = diverged > 0 || (opts.strict && (orphaned > 0 || upstreamUpdated > 0));

  if (opts.json) {
    console.log(JSON.stringify({ counts: report.counts, files: report.files }, null, 2));
    if (failed) process.exitCode = 1;
    return;
  }

  if (report.files.length === 0) {
    console.log(ansis.gray('No generated components to audit.'));
    return;
  }

  console.log(ansis.cyan(`\n⚗  Crucible Audit — ${outputDir}\n`));
  for (const f of report.files) {
    console.log(`  ${ICON[f.state]}  ${LABEL[f.state].padEnd(16)} ${ansis.gray(f.hashKey)}`);
  }

  console.log('');
  const parts = (Object.keys(LABEL) as ReportFileState[])
    .map((s) => ({ s, n: report.counts[s] ?? 0 }))
    .filter(({ n }) => n > 0)
    .map(({ s, n }) => `${n} ${LABEL[s]}`);
  console.log(`  ${parts.join(', ')}`);

  if (diverged > 0) {
    console.log(ansis.red(`\n⚠ ${diverged} file(s) diverged — run \`crucible upgrade\` to merge.`));
  } else if (upstreamUpdated > 0) {
    console.log(ansis.cyan(`\n↑ ${upstreamUpdated} file(s) have upstream updates available.`));
  }
  console.log('');

  if (failed) process.exitCode = 1;
}
