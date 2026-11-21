// Boot for NEON PALMS round 3: loads the sample photos + display fonts,
// then either runs the editor or renders one fixed shot (?shot=cover /
// ?shot=editor) for screenshots. No network: everything loads from app/.
//
// Round 3: sample photos load in parallel (Promise.all, not one by one),
// fonts load with a 3 s timeout so a slow font can never hang the boot,
// the shot state now carries ribbon / badge / tagline / heat from the URL,
// and a boot failure writes a visible error line instead of failing
// silently with a blank canvas.

import { createEditor, defaultState, SAMPLE_PHOTOS } from './editor.js';
import { renderCover } from './cover.js';
import { shotParams, shotSize, validLayout, validGrade, markShotReady } from './shots.js';

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`could not load ${src}`));
    img.src = src;
  });
}

async function loadFonts() {
  const wanted = Promise.all([
    document.fonts.load('100px Anton'),
    document.fonts.load('40px Pacifico'),
    document.fonts.ready,
  ]);
  const timeout = new Promise((resolve) => setTimeout(resolve, 3000));
  try {
    await Promise.race([wanted, timeout]);
  } catch {
    // Fall back to system fonts if a vendored font fails to parse.
  }
}

/** Apply the URL shot params onto a fresh default state. */
function stateFromParams(params) {
  const state = defaultState();
  state.layout = validLayout(params.layout);
  state.grade = validGrade(params.grade);
  state.title = params.title;
  state.subtitle = params.subtitle;
  state.ribbon = params.ribbon;
  state.badge = params.badge;
  state.tagline = params.tagline;
  state.heat = params.heat;
  return state;
}

async function boot() {
  const params = shotParams();
  // Parallel load: five photos at once instead of one after another.
  const loaded = await Promise.all(
    SAMPLE_PHOTOS.map((p) => loadImage(p.src).then((img) => [p.src, img])),
  );
  const images = Object.fromEntries(loaded);
  await loadFonts();

  const canvas = document.getElementById('preview');

  if (params.shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = shotSize(params.size);
    canvas.width = size.w;
    canvas.height = size.h;
    renderCover(canvas, stateFromParams(params), images);
    markShotReady();
    return;
  }

  // Editor (and ?shot=editor): full UI, live preview.
  document.body.classList.add('shot-editor');
  const editor = createEditor(canvas, images);
  if (params.shot === 'editor') {
    const staged = stateFromParams(params);
    Object.assign(editor.state, staged);
    editor.render();
    editor.syncInputs();
  }
  markShotReady();
}

boot().catch((err) => {
  const status = document.getElementById('status');
  if (status) status.textContent = `Could not start: ${err.message}`;
  const stage = document.querySelector('.stage');
  if (stage) {
    const note = document.createElement('p');
    note.className = 'boot-error';
    note.textContent = `Could not start the studio: ${err.message}`;
    stage.appendChild(note);
  }
  window.__shotReady = true;
});
