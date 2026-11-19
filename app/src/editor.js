// Editor UI for NEON PALMS: sample picker, layout + grade pills, editable
// lettering, per-panel crop controls, undo/redo, randomize, export.

import { renderCover } from './cover.js';
import { LAYOUTS, layoutPanels, layoutById } from './panels.js';
import { GRADES, gradeById } from './grades.js';
import { exportAllSizes } from './export.js';

export const SAMPLE_PHOTOS = [
  { src: 'samples/convertible.jpg', name: 'Convertible' },
  { src: 'samples/motorcycle.jpg', name: 'Motorcycle' },
  { src: 'samples/diner.jpg', name: 'Diner Friends' },
  { src: 'samples/surfer.jpg', name: 'Surfer' },
];

export const RANDOM_TITLES = [
  'NEON PALMS', 'SUNSET CHASE', 'GOLDEN HOUR', 'PALM MERIDIAN',
  'VICE LIGHTS', 'AFTER HOURS', 'NEON BAY', 'HEAT WAVE',
];

export function defaultState() {
  return {
    layout: 'hero3',
    grade: 'vice-sunset',
    title: 'NEON PALMS',
    subtitle: 'golden hour in Neon Bay',
    badge: 'EST. 2026 · NEON BAY',
    tagline: 'ONE CITY. EVERY SUNSET A STAGE.',
    heat: 4,
    fillAll: false,
    grain: true,
    vignette: true,
    halftone: true,
    stickers: true,
    selected: 0,
    panels: [
      { src: 'samples/convertible.jpg', x: 0.5, y: 0.42, zoom: 1, rot: 0, flip: false, grade: null },
      { src: 'samples/motorcycle.jpg', x: 0.5, y: 0.5, zoom: 1, rot: 0, flip: false, grade: null },
      { src: 'samples/diner.jpg', x: 0.5, y: 0.45, zoom: 1, rot: 0, flip: false, grade: null },
      { src: 'samples/surfer.jpg', x: 0.55, y: 0.75, zoom: 1.35, rot: 0, flip: false, grade: null },
    ],
  };
}

function clone(o) { return JSON.parse(JSON.stringify(o)); }

export function createEditor(canvas, images) {
  const $ = (id) => document.getElementById(id);
  const state = defaultState();
  let history = [clone(state)];
  let future = [];
  let currentPanels = [];

  function snapshot() {
    history.push(clone(state));
    if (history.length > 60) history.shift();
    future = [];
    syncHistoryButtons();
  }
  function syncHistoryButtons() {
    $('undoBtn').disabled = history.length <= 1;
    $('redoBtn').disabled = future.length === 0;
  }
  function undo() {
    if (history.length <= 1) return;
    future.push(clone(state));
    Object.assign(state, clone(history.pop()));
    render(); syncInputs(); syncHistoryButtons();
  }
  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    Object.assign(state, clone(future.pop()));
    render(); syncInputs(); syncHistoryButtons();
  }

  function render() {
    currentPanels = renderCover(canvas, state, images).panels;
    const sel = state.panels[state.selected];
    $('panelLabel').textContent = sel
      ? `Panel ${state.selected + 1} · ${SAMPLE_PHOTOS.find((p) => p.src === sel.src)?.name || 'Custom photo'} — drag to pan · zoom / rotate below`
      : 'Pick a panel';
  }

  function syncInputs() {
    $('titleInput').value = state.title;
    $('subtitleInput').value = state.subtitle;
    $('badgeInput').value = state.badge;
    $('taglineInput').value = state.tagline;
    $('heatInput').value = state.heat;
    $('fillAllToggle').checked = state.fillAll;
    $('grainToggle').checked = state.grain;
    $('vignetteToggle').checked = state.vignette;
    $('halftoneToggle').checked = state.halftone;
    $('stickersToggle').checked = state.stickers;
    const sel = state.panels[state.selected];
    if (sel) {
      $('zoomSlider').value = sel.zoom;
      $('rotateSlider').value = sel.rot;
      $('panelGrade').value = sel.grade || '';
    }
    document.querySelectorAll('#layoutPills button').forEach((b) =>
      b.classList.toggle('active', b.dataset.layout === state.layout));
    document.querySelectorAll('#gradePills button').forEach((b) =>
      b.classList.toggle('active', b.dataset.grade === state.grade));
    document.querySelectorAll('#samples button').forEach((b) =>
      b.classList.toggle('active', state.panels[state.selected]?.src === b.dataset.src));
  }

  function buildPills() {
    const lp = $('layoutPills');
    LAYOUTS.forEach((l) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.layout = l.id; b.textContent = l.name;
      b.addEventListener('click', () => { state.layout = l.id; snapshot(); render(); syncInputs(); });
      lp.appendChild(b);
    });
    const gp = $('gradePills');
    GRADES.forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.grade = g.id; b.textContent = g.name;
      b.addEventListener('click', () => { state.grade = g.id; snapshot(); render(); syncInputs(); });
      gp.appendChild(b);
    });
    const sp = $('samples');
    SAMPLE_PHOTOS.forEach((p) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.src = p.src;
      const img = document.createElement('img');
      img.src = p.src; img.alt = p.name;
      const span = document.createElement('span'); span.textContent = p.name;
      b.append(img, span);
      b.addEventListener('click', () => {
        state.panels[state.selected].src = p.src;
        snapshot(); render(); syncInputs();
      });
      sp.appendChild(b);
    });
    const pg = $('panelGrade');
    const none = document.createElement('option');
    none.value = ''; none.textContent = 'Use cover grade';
    pg.appendChild(none);
    GRADES.forEach((g) => {
      const o = document.createElement('option');
      o.value = g.id; o.textContent = g.name;
      pg.appendChild(o);
    });
  }

  function bindText(id, key) {
    $(id).addEventListener('input', (e) => { state[key] = e.target.value; render(); });
    $(id).addEventListener('change', () => snapshot());
  }

  function bindToggle(id, key) {
    $(id).addEventListener('change', (e) => { state[key] = e.target.checked; snapshot(); render(); });
  }

  function bindAll() {
    bindText('titleInput', 'title');
    bindText('subtitleInput', 'subtitle');
    bindText('badgeInput', 'badge');
    bindText('taglineInput', 'tagline');
    $('heatInput').addEventListener('input', (e) => { state.heat = Number(e.target.value); render(); });
    $('heatInput').addEventListener('change', () => snapshot());
    bindToggle('fillAllToggle', 'fillAll');
    bindToggle('grainToggle', 'grain');
    bindToggle('vignetteToggle', 'vignette');
    bindToggle('halftoneToggle', 'halftone');
    bindToggle('stickersToggle', 'stickers');
    $('zoomSlider').addEventListener('input', (e) => {
      state.panels[state.selected].zoom = Number(e.target.value); render();
    });
    $('zoomSlider').addEventListener('change', () => snapshot());
    $('rotateSlider').addEventListener('input', (e) => {
      state.panels[state.selected].rot = Number(e.target.value); render();
    });
    $('rotateSlider').addEventListener('change', () => snapshot());
    $('flipBtn').addEventListener('click', () => {
      const p = state.panels[state.selected];
      p.flip = !p.flip; snapshot(); render();
    });
    $('panelGrade').addEventListener('change', (e) => {
      state.panels[state.selected].grade = e.target.value || null;
      snapshot(); render();
    });
    $('undoBtn').addEventListener('click', undo);
    $('redoBtn').addEventListener('click', redo);
    $('randomBtn').addEventListener('click', () => {
      state.layout = LAYOUTS[Math.floor(Math.random() * LAYOUTS.length)].id;
      state.grade = GRADES[Math.floor(Math.random() * GRADES.length)].id;
      state.title = RANDOM_TITLES[Math.floor(Math.random() * RANDOM_TITLES.length)];
      state.heat = 3 + Math.floor(Math.random() * 3);
      const shuffled = [...SAMPLE_PHOTOS].sort(() => Math.random() - 0.5);
      state.panels.forEach((p, i) => { p.src = shuffled[i % shuffled.length].src; p.rot = Math.round((Math.random() - 0.5) * 8); });
      snapshot(); render(); syncInputs();
    });
    $('exportBtn').addEventListener('click', async () => {
      $('status').textContent = 'Exporting all three sizes…';
      const done = await exportAllSizes(state, images, (id, bytes) => {
        $('status').textContent = `Exported ${id} (${Math.round(bytes / 1024)} KB)…`;
      });
      $('status').textContent = `Exported ${done.length} PNGs — 1080×1080, 1080×1350, 1920×1080.`;
    });
    $('uploadInput').addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        images[url] = img;
        state.panels[state.selected].src = url;
        snapshot(); render(); syncInputs();
        $('status').textContent = 'Your photo is in — drag it into place.';
      };
      img.src = url;
    });
    // Click a panel to select it; drag to pan the photo inside it.
    let drag = null;
    const toCanvas = (e) => {
      const r = canvas.getBoundingClientRect();
      return { x: (e.clientX - r.left) * (canvas.width / r.width), y: (e.clientY - r.top) * (canvas.height / r.height) };
    };
    canvas.addEventListener('pointerdown', (e) => {
      const pt = toCanvas(e);
      const { panels } = layoutPanels(state.layout, canvas.width, canvas.height);
      let hit = -1;
      for (let i = panels.length - 1; i >= 0; i--) {
        const r = panels[i];
        if (pt.x >= r.x && pt.x <= r.x + r.w && pt.y >= r.y && pt.y <= r.y + r.h) { hit = i; break; }
      }
      if (hit < 0) return;
      state.selected = Math.min(hit, state.panels.length - 1);
      drag = { start: pt, panel: clone(state.panels[state.selected]), rect: panels[hit] };
      canvas.setPointerCapture(e.pointerId);
      render(); syncInputs();
    });
    canvas.addEventListener('pointermove', (e) => {
      if (!drag) return;
      const pt = toCanvas(e);
      const p = state.panels[state.selected];
      p.x = Math.max(0, Math.min(1, drag.panel.x + ((pt.x - drag.start.x) / drag.rect.w) * 0.9));
      p.y = Math.max(0, Math.min(1, drag.panel.y + ((pt.y - drag.start.y) / drag.rect.h) * 0.9));
      render();
    });
    canvas.addEventListener('pointerup', () => { if (drag) { drag = null; snapshot(); } });
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
    });
  }

  buildPills();
  bindAll();
  syncInputs();
  syncHistoryButtons();
  render();
  return { state, render, undo, redo, syncInputs };
}

export { layoutById, gradeById };
