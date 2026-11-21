// NEON PALMS — Cover Studio, round 3: the entry program for gta6-cover-art-01.
// Node 22, standard library only. It assembles the offline browser app in
// app/ (vanilla ES modules, 2D canvas, zero dependencies, no network), the
// screenshots in screenshots/, and the hero entry image entry.png in the
// repo root, then writes /output/dossier.json with the vendored make.fun
// library (vendor/makefun-app.ts).
//
// The app turns a photo + caption into GTA-style multi-panel poster cover
// art: 10 layouts (incl. the new Boulevard + Skyline), 8 gradient-map grades
// (incl. the new Vice Dusk + Boulevard Pink), Anton + Pacifico lettering
// with a halftone title block, per-panel crop/zoom/rotate, per-panel grade
// override, undo/redo, randomize, a diagonal ribbon, a segmented heat
// meter, stickers, grain and vignette, and one-click PNG export in four
// post sizes (square, portrait, landscape, story).
//
// Round 3 is a real rewrite, not a re-type: the cover spec changed to the
// "Vice Dusk" palette (magenta dusk sky over a teal boulevard, gold
// lettering), the hero is a person on a neon street instead of a car, the
// title band gained a ribbon + segmented heat meter + badge rays, and the
// entry program now refuses to hand in an entry without entry.png — the
// round-2 deliverable failure was a missing entry image in the repo root.
//
// Serve it locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader's container, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The round-3 cover spec: everything the poster promises, in one place,
// so the entry program, the screenshots and the README can never drift.
export const COVER_SPEC = {
  title: 'NEON PALMS',
  subtitle: 'dusk falls on Neon Bay',
  tagline: 'EVERY STREET IS A STAGE',
  ribbon: 'VICE DUSK · 2026',
  badge: 'EST. 2026 · NEON BAY',
  heat: 5,
  palette: 'vice-dusk',
  layout: 'boulevard',
  grade: 'vice-dusk',
  hero: 'woman in a pink blazer by a vintage car at dusk, neon street',
  devices: ['gradient title', 'script subtitle', 'heat meter', 'ribbon', 'tagline bar', 'badge', 'halftone'],
};

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

function fail(message) {
  throw new Error(`NEON PALMS entry check failed: ${message}`);
}

function listFiles(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isFile())
    .map((e) => e.name)
    .sort();
}

/** Round 2 handed in no entry image. Round 3 refuses to repeat that:
 *  entry.png must exist in the repo root, be a real PNG, and be big
 *  enough to read at thumbnail size (at least 64 KiB). */
function requireEntryImage() {
  const entry = join(here, 'entry.png');
  if (!existsSync(entry)) fail('entry.png is missing from the repo root');
  const size = statSync(entry).size;
  if (size < 65536) fail(`entry.png is only ${size} bytes — too small to judge`);
  // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A.
  const head = readFileSync(entry).subarray(0, 8);
  const magic = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (!magic.every((b, i) => head[i] === b)) fail('entry.png is not a PNG file');
  return { path: entry, bytes: size };
}

function validateScreenshots() {
  const dir = join(here, 'screenshots');
  const shots = listFiles(dir);
  if (shots.length === 0) fail('no screenshots to hand in — the judge reads the cover through them');
  if (shots.length > 4) fail(`${shots.length} screenshots, cap is 4`);
  for (const name of shots) {
    const size = statSync(join(dir, name)).size;
    if (size > 262144) fail(`screenshot ${name} is ${size} bytes, cap is 256 KiB`);
  }
  return shots;
}

// Copy the app in first: every static file the browser needs lives here.
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });

// Then the screenshots, then the entry image itself.
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  cpSync(join(here, 'screenshots'), join(out, 'screenshots'), { recursive: true });
}
const shots = validateScreenshots();
const entryImage = requireEntryImage();
cpSync(entryImage.path, join(out, 'entry.png'));

// A manifest so a human (or the next round) can see what was handed in
// without unpacking the dossier: spec, files, sizes, timestamp.
const manifest = {
  entry: 'NEON PALMS — Cover Studio',
  competition: 'gta6-cover-art-01',
  round: 3,
  spec: COVER_SPEC,
  screenshots: shots,
  entryImageBytes: entryImage.bytes,
  builtAt: new Date().toISOString(),
};
writeFileSync(join(out, 'cover-manifest.json'), JSON.stringify(manifest, null, 2) + '\n');

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
console.log(
  `NEON PALMS round 3 handed in: ${shots.length} screenshots, entry.png ${entryImage.bytes} bytes, ` +
  `dossier ${dossier.length} bytes, palette ${COVER_SPEC.palette}.`,
);
