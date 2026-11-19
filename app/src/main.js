// Boot for NEON PALMS: loads the sample photos + display fonts, then either
// runs the editor or renders one fixed shot (?shot=cover / ?shot=editor)
// for screenshots. No network: everything loads from app/.

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
  try {
    await Promise.all([
      document.fonts.load('100px Anton'),
      document.fonts.load('40px Pacifico'),
      document.fonts.ready,
    ]);
  } catch {
    // Fall back to system fonts if a vendored font fails to parse.
  }
}

async function boot() {
  const params = shotParams();
  const images = {};
  for (const p of SAMPLE_PHOTOS) images[p.src] = await loadImage(p.src);
  await loadFonts();

  const canvas = document.getElementById('preview');

  if (params.shot === 'cover') {
    document.body.classList.add('shot-cover');
    const size = shotSize(params.size);
    canvas.width = size.w;
    canvas.height = size.h;
    const state = defaultState();
    state.layout = validLayout(params.layout);
    state.grade = validGrade(params.grade);
    state.title = params.title;
    state.subtitle = params.subtitle;
    renderCover(canvas, state, images);
    markShotReady();
    return;
  }

  // Editor (and ?shot=editor): full UI, live preview.
  document.body.classList.add('shot-editor');
  const editor = createEditor(canvas, images);
  if (params.shot === 'editor') {
    editor.state.layout = validLayout(params.layout);
    editor.state.grade = validGrade(params.grade);
    editor.state.title = params.title;
    editor.state.subtitle = params.subtitle;
    editor.render();
    editor.syncInputs();
  }
  markShotReady();
}

boot().catch((err) => {
  const status = document.getElementById('status');
  if (status) status.textContent = `Could not start: ${err.message}`;
  window.__shotReady = true;
});
