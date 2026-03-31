import { rm } from 'node:fs/promises';
import path from 'path';
import chalk from 'chalk';
import { pathExists } from '../../utils/fs';

export interface CleanOptions {
  all?: boolean;
  cwd?: string;
}

export async function runClean(opts: CleanOptions = {}) {
  const cwd = opts.cwd || process.cwd();
  const pathsToDelete = [
    path.join(cwd, '.crucible'),
    path.join(cwd, 'src', '__generated__'),
    path.join(cwd, 'src', 'components'),
  ];
  if (opts.all) {
    pathsToDelete.push(path.join(cwd, 'crucible.config.json'));
  }

  console.log(chalk.blue('\n🧹 Cleaning generated files...\n'));
  for (const p of pathsToDelete) {
    if (await pathExists(p)) {
      await rm(p, { recursive: true, force: true });
      console.log(chalk.green(`✔ Removed: ${path.relative(cwd, p)}`));
    }
  }
  console.log(chalk.blue('\n✨ Clean complete!\n'));
}

export async function runPgClean() {
  const frameworks = ['react', 'vue', 'angular'];
  console.log(chalk.blue('\n🧹 Cleaning playground folders...\n'));

  for (const fw of frameworks) {
    const basePath = path.join(process.cwd(), 'playground', fw);
    const pathsToDelete = [
      path.join(basePath, '.crucible'),
      path.join(basePath, 'src', '__generated__'),
      path.join(basePath, 'public', '__generated__'),
      path.join(basePath, 'crucible.config.json'),
    ];

    for (const p of pathsToDelete) {
      if (await pathExists(p)) {
        await rm(p, { recursive: true, force: true });
        console.log(chalk.green(`✔ Removed: playground/${fw}/${path.relative(basePath, p)}`));
      }
    }
  }
  console.log(chalk.blue('\n✨ Playground clean complete!\n'));
}
