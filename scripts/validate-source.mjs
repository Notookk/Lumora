import { readdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const source = resolve(root, 'src');
const files = [];
const walk = async (directory) => {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = resolve(directory, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(path);
  }
};
await walk(source);

for (const file of files) {
  const content = await readFile(file, 'utf8');
  if (/\/\/\s*(TODO|FIXME)\b/i.test(content)) throw new Error(`Unfinished marker found in ${file}`);
  if (/<script[\s>]/i.test(content)) throw new Error(`Inline script found in ${file}`);
}
console.log(`LUMORA source validated (${files.length} TypeScript files).`);
