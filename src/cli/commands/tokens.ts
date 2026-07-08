import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { readConfig } from '../../config/reader';
import { resolveTokens } from '../../tokens/resolver';
import { buildComponentModel } from '../../components/model';
import { renderGlobalTokens } from '../../templates/engine';
import { pathExists } from '../../utils/fs';

export interface TokensOptions {
  force?: boolean;
  dryRun?: boolean;
  quiet?: boolean;
  cwd?: string;
}

export async function runTokens(opts: TokensOptions = {}) {
  const cwd = opts.cwd || process.cwd();

  if (!opts.quiet) console.log(ansis.cyan(`\n⚗  Crucible Tokens\n`));

  const config = await readConfig(path.join(cwd, 'crucible.config.json'));
  const tokens = resolveTokens(config);
  const model = buildComponentModel('Button', tokens, config, false);
  const rendered = await renderGlobalTokens(model);
  const tokensOutDir = path.join(cwd, 'public/__generated__');
  const tokensPath = path.join(tokensOutDir, rendered.filename);

  const exists = await pathExists(tokensPath);

  if (exists && !opts.force) {
    if (!opts.quiet) {
      console.log(ansis.yellow(`⚠  ${tokensPath} already exists.`));
      console.log(
        ansis.yellow(`   Use --force to regenerate, or run 'crucible tokens --force' to update.`),
      );
    }
    return;
  }

  if (opts.dryRun) {
    if (!opts.quiet) {
      console.log(ansis.green(`~  ${tokensPath} (would be written)`));
      console.log(ansis.gray(`\nContent preview:\n${rendered.content.slice(0, 500)}...`));
    }
    return;
  }

  await mkdir(tokensOutDir, { recursive: true });
  await writeFile(tokensPath, rendered.content);
  if (!opts.quiet) {
    console.log(ansis.green(`✔  Generated ${tokensPath}`));
    console.log(ansis.gray(`   Theme: ${config.theme} | Dark mode: ${!!config.darkMode}`));
  }
}
