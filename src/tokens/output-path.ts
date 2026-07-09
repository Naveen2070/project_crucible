import path from 'path';
import { Framework } from '../core/enums';

/**
 * Where global token output (tokens.css / theme.ts / tailwind.preset.js) is written.
 * Web frameworks use `public/__generated__` (imported via `<link>`/`<style>` in index.html).
 * React Native has no `public/` — that's a Vite/web convention Metro doesn't serve — so RN tokens
 * go to the project root instead, next to `tailwind.config.js` (so
 * `presets: [require('./tailwind.preset.js')]` just works with no path juggling).
 */
export function getTokensOutDir(cwd: string, framework: string): string {
  return framework === Framework.ReactNative ? cwd : path.join(cwd, 'public/__generated__');
}

/**
 * Relative, extension-less import path from a generated component's own directory
 * (`<outDir>/<ComponentName>/`) to the RN `theme.ts` file, e.g. `../../../theme` for the default
 * `src/components` layout. Only meaningful for react-native + stylesheet.
 */
export function getThemeImportPath(outDir: string, tokensOutDir: string): string {
  const fromComponentDir = path.join(outDir, '__component__');
  const rel = path.relative(fromComponentDir, path.join(tokensOutDir, 'theme'));
  const posix = rel.split(path.sep).join('/');
  return posix.startsWith('.') ? posix : `./${posix}`;
}
