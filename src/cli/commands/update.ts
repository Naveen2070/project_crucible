import path from 'path';
import ansis from 'ansis';
import { loadHashes } from '../../scaffold/writer';
import { trackedComponents } from '../utils/output-dir';
import { runAdd } from './add';

/**
 * Regenerate already-tracked components. With no names it updates every component recorded in the
 * manifest; otherwise just the named ones. Delegates to the `add` pipeline, which preserves user
 * edits unless `--force` is given.
 */
export async function runUpdate(components: string[], opts: any) {
  const cwd = path.resolve(process.cwd(), opts.cwd || '.');
  const manifest = await loadHashes(cwd);
  const tracked = trackedComponents(manifest.files);

  const target = components && components.length > 0 ? components : tracked;

  if (target.length === 0) {
    if (!opts.quiet) {
      console.log(
        ansis.gray('No generated components to update. Run `crucible add <Component>` first.'),
      );
    }
    return;
  }

  if (!opts.quiet) {
    console.log(ansis.cyan(`\n⚗  Updating: ${target.join(', ')}\n`));
  }

  await runAdd(target, opts);
}
