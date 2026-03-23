import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { readConfig } from '../config/reader';
import { resolveTokens } from '../tokens/resolver';
import { buildComponentModel } from '../components/model';
import { renderGlobalTokens } from '../templates/engine';

export interface TokensOptions {
  force?: boolean;
  dryRun?: boolean;
  cwd?: string;
}

export async function runTokens(opts: TokensOptions = {}) {
  const cwd = opts.cwd || process.cwd();

  console.log(chalk.cyan(`\n⚗  Crucible Tokens\n`));

  try {
    const config = await readConfig(path.join(cwd, 'crucible.config.json'));
    const tokens = resolveTokens(config);
    const tokensOutDir = path.join(cwd, 'public/__generated__');
    const tokensPath = path.join(tokensOutDir, 'tokens.css');

    const exists = await fs.pathExists(tokensPath);

    if (exists && !opts.force) {
      console.log(chalk.yellow(`⚠  ${tokensPath} already exists.`));
      console.log(
        chalk.yellow(`   Use --force to regenerate, or run 'crucible tokens --force' to update.`),
      );
      return;
    }

    const model = buildComponentModel('Button', tokens, config, false);
    const tokensContent = await renderGlobalTokens(model);

    if (opts.dryRun) {
      console.log(chalk.green(`~  ${tokensPath} (would be written)`));
      console.log(chalk.gray(`\nContent preview:\n${tokensContent.slice(0, 500)}...`));
      return;
    }

    await fs.ensureDir(tokensOutDir);
    await fs.writeFile(tokensPath, tokensContent);
    console.log(chalk.green(`✔  Generated ${tokensPath}`));
    console.log(chalk.gray(`   Theme: ${config.theme} | Dark mode: ${!!config.darkMode}`));
  } catch (error: any) {
    console.error(chalk.red(`✗ Error: ${error.message}`));
    process.exit(1);
  }
}
