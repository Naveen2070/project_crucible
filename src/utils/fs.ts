import { access, readFile, writeFile, mkdir, rm, readdir, stat } from 'node:fs/promises';

export const pathExists = (p: string) =>
  access(p).then(
    () => true,
    () => false,
  );
export const readJson = (p: string) => readFile(p, 'utf-8').then(JSON.parse);
export const writeJson = (p: string, data: unknown) => writeFile(p, JSON.stringify(data, null, 2));
export const ensureDir = (p: string) => mkdir(p, { recursive: true });
export const remove = (p: string) => rm(p, { recursive: true, force: true });
