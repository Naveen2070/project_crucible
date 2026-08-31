import { readFile } from 'node:fs/promises';
import path from 'path';
import { CrucibleConfig } from '../config/reader';
import { Framework } from '../core/enums';
import { generate } from '../api/generate';
import { formatFile, Manifest } from '../scaffold/writer';
import { trackedComponents } from '../cli/utils/output-dir';
import { pathExists } from '../utils/fs';
import { pluginRegistry } from '../plugins/registry';
import { classifyFile, FileState } from './classify';

export type ReportFileState = FileState | 'orphaned' | 'new';

export interface ReportFileEntry {
  hashKey: string;
  state: ReportFileState;
  base?: string;
  theirs?: string;
  ours?: string;
}

export interface ClassificationReport {
  files: ReportFileEntry[];
  counts: Partial<Record<ReportFileState, number>>;
}

export interface ClassifyOptions {
  cwd: string;
  outDir: string;
  config: CrucibleConfig;
  framework: Framework;
  generateStories: boolean;
  manifest: Manifest;
  /** Restrict to these components; default = every component tracked in the manifest. */
  components?: string[];
}

/**
 * Single source of truth for D2's file-state taxonomy across `audit`, `diff`, `status`, and
 * `upgrade` — renders THEIRS for every target component, reads OURS from disk, and classifies
 * each tracked file via `classifyFile`. A component whose plugin has disappeared (no longer
 * resolvable) is reported `orphaned` for each of its manifest entries, never rendered.
 */
export async function classifyTree(opts: ClassifyOptions): Promise<ClassificationReport> {
  const allTracked = trackedComponents(opts.manifest.files);
  const target = opts.components && opts.components.length > 0 ? opts.components : allTracked;

  const knownIds = new Set(pluginRegistry.getAllComponentIds());
  const known = target.filter((c) => knownIds.has(c));
  const orphanedComponents = target.filter((c) => !knownIds.has(c));

  const files: ReportFileEntry[] = [];

  for (const comp of orphanedComponents) {
    for (const hashKey of Object.keys(opts.manifest.files)) {
      if (hashKey.split('/')[0] === comp) files.push({ hashKey, state: 'orphaned' });
    }
  }

  if (known.length > 0) {
    const result = await generate({
      components: known,
      cwd: opts.cwd,
      outDir: opts.outDir,
      config: opts.config,
      framework: opts.framework,
      generateStories: opts.generateStories,
    });

    for (const generated of result.components) {
      for (const [filename, raw] of Object.entries(generated.files)) {
        const hashKey = `${generated.name}/${filename}`;
        const onDiskPath = path.join(opts.outDir, generated.name, filename);
        const theirs = await formatFile(raw, onDiskPath, opts.cwd);

        if (!(await pathExists(onDiskPath))) {
          files.push({ hashKey, state: 'new', theirs });
          continue;
        }

        const ours = await readFile(onDiskPath, 'utf-8');
        const cls = classifyFile(opts.manifest.files[hashKey], theirs, ours);
        files.push({ hashKey, state: cls.state, base: cls.base, theirs: cls.theirs, ours: cls.ours });
      }
    }
  }

  const counts: Partial<Record<ReportFileState, number>> = {};
  for (const f of files) counts[f.state] = (counts[f.state] ?? 0) + 1;

  return { files, counts };
}
