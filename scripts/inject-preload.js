/**
 * Post-build script: injects <link rel="modulepreload"> for the HomeModule
 * lazy chunk into the built index.html.
 *
 * The HomeModule is always the first lazy route loaded (/ redirects to /home),
 * so it's on the critical path. Preloading it lets the browser download it in
 * parallel with main.js instead of waiting for main.js to execute first,
 * eliminating one sequential hop from the critical request chain.
 *
 * We intentionally skip:
 *  - three-scene-impl (~940 KB) — only fetched when WebGL is confirmed available
 *  - game-game-module — only fetched when user opens the game
 */
const fs = require('fs');
const path = require('path');

const distDir = path.join(__dirname, '../dist/portfolio-gianluca');
const indexPath = path.join(distDir, 'index.html');

if (!fs.existsSync(indexPath)) {
  console.warn('[inject-preload] dist/portfolio-gianluca/index.html not found — skipping.');
  process.exit(0);
}

const EAGER_CHUNKS = new Set(['runtime', 'polyfills', 'main', 'styles', 'common']);
// Chunks we deliberately keep deferred (not part of the initial navigation).
const SKIP_PATTERNS = ['three-scene', 'game-game', 'paint-paint'];

const isEagerChunk = name => EAGER_CHUNKS.has(name.split('.')[0]);
const isSkipped = name => SKIP_PATTERNS.some(p => name.includes(p));

// Only JS files in the flat dist directory (Angular puts everything there)
const jsFiles = fs.readdirSync(distDir)
  .filter(f => f.endsWith('.js') && !isEagerChunk(f) && !isSkipped(f))
  .map(f => ({ name: f, size: fs.statSync(path.join(distDir, f)).size }))
  // Also skip abnormally large chunks (Three.js is ~900 KB uncompressed).
  // Any lazy chunk > 400 KB is likely a heavyweight 3D/game asset, not a route module.
  .filter(f => f.size < 400 * 1024)
  .sort((a, b) => b.size - a.size);

if (jsFiles.length === 0) {
  console.warn('[inject-preload] No suitable lazy route chunk found — skipping.');
  process.exit(0);
}

// The largest remaining chunk is the HomeModule route bundle.
const homeChunk = jsFiles[0].name;
const preloadTag = `  <link rel="modulepreload" href="${homeChunk}">`;

let html = fs.readFileSync(indexPath, 'utf8');

if (html.includes(homeChunk)) {
  console.log(`[inject-preload] preload for ${homeChunk} already present — skipping.`);
  process.exit(0);
}

html = html.replace('</head>', `${preloadTag}\n</head>`);
fs.writeFileSync(indexPath, html);
console.log(`[inject-preload] Injected modulepreload for ${homeChunk} (${(jsFiles[0].size / 1024).toFixed(1)} KB)`);
