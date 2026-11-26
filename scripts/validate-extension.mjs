import { access, readFile } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const dist = resolve(root, 'dist');
const required = [
  'manifest.json',
  'index.html',
  'serviceWorker.js',
  'mediaBridge.js',
  'wallpapers/default-clouds.webp',
  'icons/icon16.png',
  'icons/icon32.png',
  'icons/icon48.png',
  'icons/icon128.png',
  'fonts/inter-latin-wght-normal.woff2',
  'fonts/michroma-latin-400-normal.woff2',
];

for (const file of required) {
  try {
    await access(resolve(dist, file));
  } catch {
    throw new Error(`Build is missing ${file}`);
  }
}

const manifest = JSON.parse(await readFile(resolve(dist, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3) throw new Error('Expected Manifest V3.');
if (manifest.background.service_worker !== 'serviceWorker.js') throw new Error('Invalid service worker path.');
if (manifest.content_scripts[0].js[0] !== 'mediaBridge.js') throw new Error('Invalid media bridge path.');
if (manifest.content_security_policy.extension_pages.includes('eval')) throw new Error('CSP must not allow eval.');

const worker = await readFile(resolve(dist, 'serviceWorker.js'), 'utf8');
const bridge = await readFile(resolve(dist, 'mediaBridge.js'), 'utf8');
if (/\beval\s*\(/.test(worker) || /\beval\s*\(/.test(bridge)) throw new Error('Runtime code must not use eval.');
console.log('LUMORA extension build validated.');
