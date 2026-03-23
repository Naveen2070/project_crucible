import fs from 'fs-extra';
import path from 'path';
import chalk from 'chalk';
import { Framework } from '../core/enums';

export async function importTokensInIndexHtml(framework: string, cwd: string): Promise<void> {
  const indexPaths: Record<string, { index: string; href: string }> = {
    [Framework.React]: { index: 'index.html', href: '__generated__/tokens.css' },
    [Framework.Vue]: { index: 'index.html', href: '__generated__/tokens.css' },
    [Framework.Angular]: { index: 'src/index.html', href: '__generated__/tokens.css' },
  };

  const config = indexPaths[framework];
  if (!config) return;

  const indexPath = path.join(cwd, config.index);
  if (!(await fs.pathExists(indexPath))) return;

  let content = await fs.readFile(indexPath, 'utf-8');

  const hasCorrectPath = content.includes(`href="${config.href}"`);
  if (hasCorrectPath) {
    return;
  }

  if (content.includes('tokens.css')) {
    content = content.replace(/href="[^"]*tokens\.css"/, `href="${config.href}"`);
    await fs.writeFile(indexPath, content);
    console.log(chalk.gray(`  Updated tokens.css path in index.html`));
    return;
  }

  const linkTag = `\n  <link rel="stylesheet" href="${config.href}">\n`;
  content = content.replace('</head>', `${linkTag}</head>`);
  await fs.writeFile(indexPath, content);
  console.log(chalk.gray(`  Added tokens.css to index.html`));
}
