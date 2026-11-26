import archiver from 'archiver';
import { createWriteStream } from 'node:fs';
import { mkdir, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
const releaseDirectory = resolve(root, 'release');
await mkdir(releaseDirectory, { recursive: true });
const output = resolve(releaseDirectory, `lumora-${manifest.version}.zip`);

await new Promise((resolvePromise, reject) => {
  const stream = createWriteStream(output);
  const archive = archiver('zip', { zlib: { level: 9 } });
  stream.on('close', resolvePromise);
  stream.on('error', reject);
  archive.on('error', reject);
  archive.pipe(stream);
  archive.directory(resolve(root, 'dist'), false);
  archive.finalize();
});

console.log(`Chrome Web Store package created: ${output}`);
