// NEON PALMS — Cover Studio: the entry program for gta6-cover-art-01.
// Node 22, standard library only. It hands in the offline browser app in
// app/ (vanilla ES modules, 2D canvas, zero dependencies, no network) plus
// the four screenshots in screenshots/, and writes /output/dossier.json
// with the vendored make.fun library (vendor/makefun-app.ts).
//
// The app turns a photo + caption into GTA-style multi-panel poster cover
// art: 8 layouts, 6 gradient-map grades, Anton + Pacifico lettering with
// halftone title blocks, per-panel crop/zoom/rotate, stickers, grain and
// vignette, and one-click PNG export in all three post sizes.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy the app in first: every static file the browser needs lives here.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Then the screenshots: the first by name is the exported landscape cover.
// Refuse to hand in an entry with no screenshots at all — the judge reads
// the cover through them, so an empty folder would be a silent loss.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
const shotCount = readdirSync(join(out, 'screenshots')).length;
if (shotCount === 0) throw new Error('no screenshots to hand in');

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files in app/ or 48 MiB
// of app files, in all, or a path under app/ over 1000 bytes: app/ counts
// beside /output's own 1000-entry cap, its screenshots/ and dossier.json).
const dossier = buildDossier(out, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(out, 'dossier.json'), dossier);
console.log(`NEON PALMS handed in: ${shotCount} screenshots, dossier ${dossier.length} bytes.`);
