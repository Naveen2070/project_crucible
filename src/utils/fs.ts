import { access, readFile, writeFile, mkdir, rm, readdir, stat } from 'node:fs/promises';

export const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
export const readJson = (p: string) =>
  readFile(p, 'utf-8').then((raw) => {
    try {
      return JSON.parse(raw);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new Error(`Invalid JSON in ${p}: ${msg}`);
    }
  });
export const writeJson = (p: string, data: unknown) => writeFile(p, JSON.stringify(data, null, 2));
export const ensureDir = (p: string) => mkdir(p, { recursive: true });
export const remove = (p: string) => rm(p, { recursive: true, force: true });
