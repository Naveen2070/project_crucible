import { readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'path';
import ansis from 'ansis';
import { Framework } from '../core/enums';
import { pathExists } from '../utils/fs';

export async function importTokensInIndexHtml(framework: string, cwd: string): Promise<void> {
  const indexPaths: Record<string, { index: string; href: string }> = {
    [Framework.React]: { index: 'index.html', href: '__generated__/tokens.css' },
    [Framework.Vue]: { index: 'index.html', href: '__generated__/tokens.css' },
    [Framework.Angular]: { index: 'src/index.html', href: '__generated__/tokens.css' },
  };

  const config = indexPaths[framework];
  if (!config) return;

  const indexPath = path.join(cwd, config.index);
  if (!(await pathExists(indexPath))) return;

  let content = await readFile(indexPath, 'utf-8');

  const hasCorrectPath = content.includes(`href="${config.href}"`);
  if (hasCorrectPath) {
    return;
  }

  if (content.includes('tokens.css')) {
    content = content.replace(/href="[^"]*tokens\.css"/, `href="${config.href}"`);
    await writeFile(indexPath, content);
    console.log(ansis.gray(`  Updated tokens.css path in index.html`));
    return;
  }

  const linkTag = `\n  <link rel="stylesheet" href="${config.href}">\n`;
  content = content.replace('</head>', `${linkTag}</head>`);
  await writeFile(indexPath, content);
  console.log(ansis.gray(`  Added tokens.css to index.html`));
}
