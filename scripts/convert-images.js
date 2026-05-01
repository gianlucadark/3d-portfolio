/**
 * Converts ICO/PNG source assets to WebP using sharp + decode-ico.
 *
 * Edit the TARGETS array, run `node scripts/convert-images.js`,
 * then update HTML/TS references to point at the new .webp file.
 */
const sharp = require('sharp');
const decodeIco = require('decode-ico');
const fs = require('fs');
const path = require('path');

const ICONS_DIR = path.join(__dirname, '..', 'src', 'assets', 'icons');

// Use lossless WebP for icons — files are small enough that lossless
// keeps perfect alpha edges (no faint halos / "transparent-looking" artifacts)
// while staying ~5–10x smaller than the original ICO.
const TARGETS = [
  { input: 'email.png', output: 'email.webp', size: 64, lossless: true },
  { input: 'computer.ico', output: 'computer-xp.webp', size: 96, lossless: true },
  { input: 'folder.ico', output: 'folder.webp', size: 96, lossless: true },
  { input: 'profile.ico', output: 'profile-xp.webp', size: 96, lossless: true },
  { input: 'spegni.ico', output: 'spegni.webp', size: 96, lossless: true },
  { input: 'cerca.ico', output: 'cerca.webp', size: 96, lossless: true },
  { input: 'readme.ico', output: 'readme.webp', size: 96, lossless: true },
  { input: 'paper.ico', output: 'paper.webp', size: 96, lossless: true },
  { input: 'disco.ico', output: 'disco.webp', size: 96, lossless: true },
];

async function loadAsRgba(inputPath) {
  const ext = path.extname(inputPath).toLowerCase();
  const buf = fs.readFileSync(inputPath);

  // Detect if it's actually an ICO (Windows icon) regardless of extension.
  // ICO header starts with 00 00 01 00.
  const isIco = ext === '.ico' || (buf[0] === 0 && buf[1] === 0 && buf[2] === 1 && buf[3] === 0);

  if (isIco) {
    const images = decodeIco(buf);
    // Pick highest-resolution PNG image inside the ICO.
    images.sort((a, b) => (b.width * b.height) - (a.width * a.height));
    const best = images[0];
    if (best.type === 'png') {
      return sharp(best.data);
    }
    // bmp/raw RGBA
    return sharp(best.data, {
      raw: { width: best.width, height: best.height, channels: 4 }
    });
  }

  return sharp(buf);
}

(async () => {
  for (const t of TARGETS) {
    const inputPath = path.join(ICONS_DIR, t.input);
    const outputPath = path.join(ICONS_DIR, t.output);

    if (!fs.existsSync(inputPath)) {
      console.warn(`[skip] ${t.input} not found`);
      continue;
    }

    const beforeSize = fs.statSync(inputPath).size;

    try {
      const img = await loadAsRgba(inputPath);
      const webpOpts = t.lossless
        ? { lossless: true, effort: 6, alphaQuality: 100 }
        : { quality: t.quality ?? 90, effort: 6, alphaQuality: 100 };
      await img
        .resize(t.size, t.size, { fit: 'inside', withoutEnlargement: true })
        .webp(webpOpts)
        .toFile(outputPath);
    } catch (err) {
      console.error(`[err] ${t.input}: ${err.message}`);
      continue;
    }

    const afterSize = fs.statSync(outputPath).size;
    const reduction = ((1 - afterSize / beforeSize) * 100).toFixed(1);
    console.log(`[ok] ${t.input} (${(beforeSize / 1024).toFixed(1)} KB) -> ${t.output} (${(afterSize / 1024).toFixed(1)} KB) -${reduction}%`);
  }
})().catch((err) => {
  console.error(err);
  process.exit(1);
});
