import chalk from 'chalk';
import fs from 'fs-extra';
import path from 'path';
import { execSync } from 'child_process';
import { confirm } from '@inquirer/prompts';
import { registry, ComponentDef } from '../registry/components';
import { getPeerDependencies } from '../registry/peer-deps';
import { Framework } from '../core/enums';

export interface DependencyCheck {
  missingComponents: string[];
  missingPeerDeps: string[];
}

export async function checkComponentDependencies(
  component: string,
  outputDir: string,
  framework: Framework,
): Promise<DependencyCheck> {
  const def = registry[component as keyof typeof registry];
  if (!def) {
    return { missingComponents: [], missingPeerDeps: [] };
  }

  const missingComponents: string[] = [];
  const missingPeerDeps: string[] = [];

  if (def.dependencies) {
    for (const dep of def.dependencies) {
      const depExists = await checkComponentExists(dep, outputDir, framework);
      if (!depExists) {
        missingComponents.push(dep);
      }
    }
  }

  const peerDeps = getPeerDependencies(component as any, framework);
  for (const peerDep of peerDeps) {
    const installed = await checkPeerDependencyInstalled(peerDep, outputDir);
    if (!installed) {
      missingPeerDeps.push(peerDep);
    }
  }

  return { missingComponents, missingPeerDeps };
}

export async function checkComponentExists(
  component: string,
  outputDir: string,
  framework: Framework,
): Promise<boolean> {
  const compDir = path.join(outputDir, component);
  if (!(await fs.pathExists(compDir))) {
    return false;
  }

  const extensions = getComponentExtensions(framework);
  for (const ext of extensions) {
    const mainFile = path.join(compDir, `${component}${ext}`);
    if (await fs.pathExists(mainFile)) {
      return true;
    }
    const kebabFile = path.join(compDir, `${component.toLowerCase()}${ext}`);
    if (await fs.pathExists(kebabFile)) {
      return true;
    }
  }

  return false;
}

function getComponentExtensions(framework: Framework): string[] {
  switch (framework) {
    case Framework.React:
      return ['.tsx', '.jsx'];
    case Framework.Vue:
      return ['.vue'];
    case Framework.Angular:
      return ['.component.ts'];
    default:
      return ['.tsx'];
  }
}

async function checkPeerDependencyInstalled(pkg: string, projectDir: string): Promise<boolean> {
  const packageJsonPath = path.join(projectDir, 'package.json');
  if (!(await fs.pathExists(packageJsonPath))) {
    return false;
  }
  const pkgJson = await fs.readJson(packageJsonPath);
  const deps = { ...pkgJson.dependencies, ...pkgJson.devDependencies };
  return pkg in deps;
}

export async function resolveDependencies(
  component: string,
  outputDir: string,
  framework: Framework,
  options: { yes: boolean; verbose?: boolean; quiet?: boolean },
): Promise<{ components: string[]; peerDeps: string[] }> {
  const check = await checkComponentDependencies(component, outputDir, framework);
  const resolvedComponents: string[] = [];
  const resolvedPeerDeps: string[] = [];

  if (check.missingComponents.length > 0) {
    for (const missing of check.missingComponents) {
      if (options.verbose) {
        console.log(chalk.cyan(`📦 ${component} depends on ${missing} — adding...`));
      }
      resolvedComponents.push(missing);
    }
  }

  if (check.missingPeerDeps.length > 0) {
    for (const peerDep of check.missingPeerDeps) {
      if (options.yes) {
        if (!options.quiet) {
          console.log(chalk.cyan(`📦 Installing peer dependency: ${peerDep}...`));
        }
        try {
          execSync(`npm install ${peerDep}`, {
            cwd: outputDir,
            stdio: options.quiet ? 'pipe' : 'inherit',
          });
          resolvedPeerDeps.push(peerDep);
        } catch (err) {
          if (!options.quiet) {
            console.warn(
              chalk.yellow(`⚠ Failed to install ${peerDep}. You may need to install it manually.`),
            );
          }
        }
      } else {
        const shouldInstall = await confirm({
          message: `${component} requires peer dependency "${peerDep}". Install it?`,
          default: true,
        });
        if (shouldInstall) {
          try {
            execSync(`npm install ${peerDep}`, {
              cwd: outputDir,
              stdio: 'inherit',
            });
            resolvedPeerDeps.push(peerDep);
          } catch (err) {
            if (!options.quiet) {
              console.warn(
                chalk.yellow(
                  `⚠ Failed to install ${peerDep}. You may need to install it manually.`,
                ),
              );
            }
          }
        }
      }
    }
  }

  return { components: resolvedComponents, peerDeps: resolvedPeerDeps };
}

export function formatDependencyMessage(component: string, deps: string[]): string {
  if (deps.length === 0) return '';
  if (deps.length === 1) {
    return chalk.cyan(`📦 ${component} uses ${deps[0]} — will be generated`);
  }
  return chalk.cyan(
    `📦 ${component} uses ${deps.slice(0, -1).join(', ')} and ${deps[deps.length - 1]} — will be generated`,
  );
}

export function getComponentDefinition(component: string): ComponentDef | undefined {
  return registry[component as keyof typeof registry];
}

export async function installPeerDependenciesSmart(
  framework: string,
  components: string[],
  cwd: string,
): Promise<void> {
  const pkgPath = path.join(cwd, 'package.json');
  if (!(await fs.pathExists(pkgPath))) return;

  const pkg = await fs.readJson(pkgPath);
  const installed = { ...pkg.dependencies, ...pkg.devDependencies };

  const toInstall: string[] = [];
  for (const comp of components) {
    const check = await checkComponentDependencies(comp, cwd, framework as Framework);
    for (const dep of check.missingPeerDeps) {
      if (!installed[dep]) {
        toInstall.push(dep);
      }
    }
  }

  if (toInstall.length > 0) {
    const unique = [...new Set(toInstall)];
    const legacyFlag = framework === Framework.Angular ? '--legacy-peer-deps' : '';
    console.log(chalk.cyan(`📦 Installing: ${unique.join(', ')}`));
    try {
      execSync(`npm install ${unique.join(' ')} ${legacyFlag}`.trim(), {
        cwd,
        stdio: 'inherit',
      });
    } catch {
      console.warn(chalk.yellow(`⚠ Failed to install: ${unique.join(', ')}`));
    }
  }
}
