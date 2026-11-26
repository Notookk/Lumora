import { copyFile, access, readFile, unlink, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import sharp from 'sharp';

const root = resolve(import.meta.dirname, '..');
const exists = async (path) => {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
};

const wallpaperSource = resolve(root, 'public/wallpapers/default-clouds.png');
const wallpaperOutput = resolve(root, 'public/wallpapers/default-clouds.webp');
if (!(await exists(wallpaperOutput))) {
  if (!(await exists(wallpaperSource))) throw new Error('Missing default wallpaper source.');
  await sharp(wallpaperSource).webp({ quality: 88, effort: 6 }).toFile(wallpaperOutput);
  await unlink(wallpaperSource);
}

const iconSource = resolve(root, 'public/icons/icon.svg');
for (const size of [16, 32, 48, 128]) {
  await sharp(iconSource).resize(size, size).png().toFile(resolve(root, `public/icons/icon${size}.png`));
}

const fontFiles = [
  ['node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2', 'inter-latin-wght-normal.woff2'],
  ['node_modules/@fontsource/michroma/files/michroma-latin-400-normal.woff2', 'michroma-latin-400-normal.woff2'],
  ['node_modules/@fontsource-variable/inter/LICENSE', 'INTER-LICENSE.txt'],
  ['node_modules/@fontsource/michroma/LICENSE', 'MICHROMA-LICENSE.txt'],
];
for (const [source, destination] of fontFiles) {
  await copyFile(resolve(root, source), resolve(root, 'public/fonts', destination));
}

const bannerSource = resolve(root, 'docs/assets/lumora-banner-source.png');
const bannerOutput = resolve(root, 'docs/assets/lumora-banner.png');
if (await exists(bannerSource)) {
  const overlay = Buffer.from(`
    <svg xmlns="http://www.w3.org/2000/svg" width="1792" height="1024" viewBox="0 0 1792 1024">
      <defs>
        <linearGradient id="fade" x1="0" y1="0" x2="1" y2="0">
          <stop stop-color="#06101D" stop-opacity="0.34"/>
          <stop offset="0.62" stop-color="#06101D" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="text" x1="0" y1="0" x2="1" y2="1">
          <stop stop-color="#FFFFFF"/>
          <stop offset="1" stop-color="#B9DCFF"/>
        </linearGradient>
      </defs>
      <rect width="1050" height="1024" fill="url(#fade)"/>
      <g fill="#EAF7FF">
        <text x="132" y="392" font-family="Arial, sans-serif" font-size="20" letter-spacing="8" opacity="0.68">NEW TAB, REIMAGINED</text>
        <text x="124" y="526" font-family="Arial, sans-serif" font-size="116" font-weight="300" letter-spacing="22" fill="url(#text)">LUMORA</text>
        <text x="138" y="590" font-family="Arial, sans-serif" font-size="30" font-weight="300" opacity="0.78">A calmer place to begin.</text>
      </g>
      <g transform="translate(138 664)">
        <rect width="486" height="54" rx="27" fill="#D8F2FF" fill-opacity="0.07" stroke="#D8F2FF" stroke-opacity="0.18"/>
        <circle cx="28" cy="27" r="5" fill="#B9DCFF"/>
        <text x="48" y="34" font-family="Arial, sans-serif" font-size="17" letter-spacing="2.4" fill="#D8F2FF" opacity="0.78">TABS · MEDIA · MOCHI · AI</text>
      </g>
    </svg>`);
  await sharp(bannerSource)
    .composite([{ input: overlay }])
    .png({ compressionLevel: 9 })
    .toFile(bannerOutput);
  await unlink(bannerSource);
}

const manifest = JSON.parse(await readFile(resolve(root, 'manifest.json'), 'utf8'));
if (manifest.manifest_version !== 3 || !manifest.chrome_url_overrides?.newtab) {
  throw new Error('Manifest V3 new tab configuration is invalid.');
}
await writeFile(resolve(root, 'public/fonts/.prepared'), `${manifest.version}\n`);
