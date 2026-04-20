import * as fs from 'fs';
import * as path from 'path';
import ansis from 'ansis';

export const IS_DEV_MODE = (() => {
  const rootDir = path.join(__dirname, '..', '..');
  const hasPlayground = fs.existsSync(path.join(rootDir, 'playground'));
  const hasScripts = fs.existsSync(path.join(rootDir, 'scripts'));
  return hasPlayground && hasScripts;
})();

export function assertDevMode(command: string): void {
  if (!IS_DEV_MODE) {
    console.warn(
      ansis.yellow(
        `[Crucible] '${command}' is for Crucible development.\n` +
          `For generating components in your project, use: crucible add <component>\n` +
          `For available commands, run: crucible --help`,
      ),
    );
    process.exit(0);
  }
}
