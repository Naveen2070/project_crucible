export async function runPlaygroundGenerate(opts: {
  framework?: string;
  stories?: boolean;
  force?: boolean;
}) {
  const { execSync } = await import('child_process');
  const framework = opts.framework || 'all';
  const storiesFlag = opts.stories !== false ? '--stories' : '--no-stories';
  const forceFlag = opts.force ? '--force' : '';
  execSync(`npx tsx scripts/generate-playground.ts ${framework} ${storiesFlag} ${forceFlag}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

export async function runPlaygroundOpen(opts: { framework?: string }) {
  const { execSync } = await import('child_process');
  const framework = opts.framework || '';
  execSync(`npx tsx scripts/open-playground.ts open ${framework}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}

export async function runPlaygroundDev(opts: { framework?: string }) {
  const { execSync } = await import('child_process');
  const framework = opts.framework || '';
  execSync(`npx tsx scripts/open-playground.ts dev ${framework}`, {
    cwd: process.cwd(),
    stdio: 'inherit',
  });
}
