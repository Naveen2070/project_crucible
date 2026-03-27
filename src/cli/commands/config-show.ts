import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';

export interface ConfigShowOptions {
  json?: boolean;
  cwd?: string;
}

export async function runConfigShow(opts: ConfigShowOptions = {}) {
  const cwd = opts.cwd || process.cwd();
  const configPath = path.join(cwd, 'crucible.config.json');

  if (!(await fs.pathExists(configPath))) {
    console.error(chalk.red('✗ Config file not found. Run "crucible init" first.'));
    process.exit(1);
  }

  const config = await fs.readJson(configPath);
  const output = opts.json ? JSON.stringify(config) : JSON.stringify(config, null, 2);
  console.log(output);
}
