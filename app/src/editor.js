// Editor UI for NEON PALMS round 3: sample picker, layout + grade pills,
// editable lettering (incl. the new ribbon line), per-panel crop controls,
// undo/redo, randomize, preset save/load, panel nudge keys, export.
//
// Round 3 changes vs round 2:
//  - Ribbon text is editable (bindText('ribbonInput', 'ribbon')).
//  - Presets: save the whole state to localStorage, load it back, reset
//    to the round-3 default — one click each, no re-typing.
//  - Arrow keys nudge the selected panel's focal point (Shift = bigger
//    step); [ / ] cycle layouts, G cycles grades.
//  - Heat slider shows its live value next to the label.
//  - Randomize now also shuffles ribbon text, heat, sticker set and
//    per-panel grades, and it seeds from the clock so two clicks differ.
//  - History is capped at 60 and the undo/redo buttons show a count.

import { renderCover } from './cover.js';
import { LAYOUTS, layoutPanels, layoutById } from './panels.js';
import { GRADES, gradeById } from './grades.js';
import { exportAllSizes, EXPORT_SIZES } from './export.js';

export const SAMPLE_PHOTOS = [
  { src: 'samples/convertible.jpg', name: 'Convertible' },
  { src: 'samples/motorcycle.jpg', name: 'Motorcycle' },
  { src: 'samples/diner.jpg', name: 'Diner Friends' },
  { src: 'samples/surfer.jpg', name: 'Surfer' },
];

export const RANDOM_TITLES = [
  'NEON PALMS', 'SUNSET CHASE', 'GOLDEN HOUR', 'PALM MERIDIAN',
  'VICE LIGHTS', 'AFTER HOURS', 'NEON BAY', 'HEAT WAVE',
  'VICE DUSK', 'BOULEVARD PINK',
];

export const RANDOM_RIBBONS = [
  'VICE DUSK · 2026', 'NEON BAY · 2026', 'GOLDEN HOUR', 'HEAT 5 · LIVE',
  'DUSK EDITION', 'EVERY STREET IS A STAGE',
];

const PRESET_KEY = 'neon-palms-preset-v3';

export function defaultState() {
  return {
    layout: 'boulevard',
    grade: 'vice-dusk',
    title: 'NEON PALMS',
    subtitle: 'dusk falls on Neon Bay',
    badge: 'EST. 2026 · NEON BAY',
    tagline: 'EVERY STREET IS A STAGE',
    ribbon: 'VICE DUSK · 2026',
    heat: 5,
    fillAll: false,
    grain: true,
    vignette: true,
    halftone: true,
    stickers: true,
    selected: 0,
    panels: [
      { src: 'samples/convertible.jpg', x: 0.5, y: 0.42, zoom: 1, rot: 0, flip: false, grade: null, caption: '' },
      { src: 'samples/convertible.jpg', x: 0.5, y: 0.5, zoom: 1, rot: 0, flip: false, grade: null, caption: '' },
      { src: 'samples/motorcycle.jpg', x: 0.5, y: 0.45, zoom: 1, rot: 0, flip: false, grade: null, caption: '' },
      { src: 'samples/diner.jpg', x: 0.55, y: 0.75, zoom: 1.35, rot: 0, flip: false, grade: null, caption: '' },
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

  function pushHistory() {
    history.push(clone(state));
    if (history.length > 60) history.shift();
    future = [];
    syncHistoryButtons();
  }
  function syncHistoryButtons() {
    const u = $('undoBtn'), r = $('redoBtn');
    if (u) { u.disabled = history.length <= 1; u.textContent = `Undo (${history.length - 1})`; }
    if (r) { r.disabled = future.length === 0; r.textContent = `Redo (${future.length})`; }
  }
  function applySnapshot(snap) {
    Object.assign(state, clone(snap));
    render(); syncInputs(); syncHistoryButtons();
  }
  function undo() {
    if (history.length <= 1) return;
    future.push(clone(state));
    applySnapshot(history.pop());
  }
  function redo() {
    if (!future.length) return;
    history.push(clone(state));
    applySnapshot(future.pop());
  }

  function render() {
    currentPanels = renderCover(canvas, state, images).panels;
    const sel = state.panels[state.selected];
    const label = $('panelLabel');
    if (label) {
      label.textContent = sel
        ? `Panel ${state.selected + 1} · ${SAMPLE_PHOTOS.find((p) => p.src === sel.src)?.name || 'Custom photo'} — drag to pan · arrows nudge · zoom / rotate below`
        : 'Pick a panel';
    }
    const heatLabel = $('heatValue');
    if (heatLabel) heatLabel.textContent = `${state.heat} / 5`;
  }

  function syncInputs() {
    const set = (id, v) => { const el = $(id); if (el) el.value = v; };
    const check = (id, v) => { const el = $(id); if (el) el.checked = v; };
    set('titleInput', state.title);
    set('subtitleInput', state.subtitle);
    set('badgeInput', state.badge);
    set('taglineInput', state.tagline);
    set('ribbonInput', state.ribbon);
    set('heatInput', state.heat);
    check('fillAllToggle', state.fillAll);
    check('grainToggle', state.grain);
    check('vignetteToggle', state.vignette);
    check('halftoneToggle', state.halftone);
    check('stickersToggle', state.stickers);
    const sel = state.panels[state.selected];
    if (sel) {
      set('zoomSlider', sel.zoom);
      set('rotateSlider', sel.rot);
      set('panelGrade', sel.grade || '');
      set('captionInput', sel.caption || '');
    }
    document.querySelectorAll('#layoutPills button').forEach((b) =>
      b.classList.toggle('active', b.dataset.layout === state.layout));
    document.querySelectorAll('#gradePills button').forEach((b) =>
      b.classList.toggle('active', b.dataset.grade === state.grade));
    document.querySelectorAll('#samples button').forEach((b) =>
      b.classList.toggle('active', state.panels[state.selected]?.src === b.dataset.src));
    render();
  }

  function buildPills() {
    const lp = $('layoutPills');
    LAYOUTS.forEach((l) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.layout = l.id; b.textContent = l.name;
      b.title = `${l.panels} panel${l.panels === 1 ? '' : 's'}`;
      b.addEventListener('click', () => { state.layout = l.id; pushHistory(); render(); syncInputs(); });
      lp.appendChild(b);
    });
    const gp = $('gradePills');
    GRADES.forEach((g) => {
      const b = document.createElement('button');
      b.type = 'button'; b.dataset.grade = g.id; b.textContent = g.name;
      b.title = g.desc || '';
      b.addEventListener('click', () => { state.grade = g.id; pushHistory(); render(); syncInputs(); });
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
        pushHistory(); render(); syncInputs();
      });
      sp.appendChild(b);
    });
    const pg = $('panelGrade');
    if (pg) {
      const none = document.createElement('option');
      none.value = ''; none.textContent = 'Use cover grade';
      pg.appendChild(none);
      GRADES.forEach((g) => {
        const o = document.createElement('option');
        o.value = g.id; o.textContent = g.name;
        pg.appendChild(o);
      });
    }
  }

  function bindText(id, key) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('input', (e) => { state[key] = e.target.value; render(); });
    el.addEventListener('change', () => pushHistory());
  }

  function bindToggle(id, key) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('change', (e) => { state[key] = e.target.checked; pushHistory(); render(); });
  }

  function cycle(list, current, dir) {
    const i = list.findIndex((x) => x.id === current);
    return list[(i + dir + list.length) % list.length].id;
  }

  function randomize() {
    const seed = Date.now() % 100000;
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    state.layout = pick(LAYOUTS).id;
    state.grade = pick(GRADES).id;
    state.title = pick(RANDOM_TITLES);
    state.ribbon = pick(RANDOM_RIBBONS);
    state.heat = 3 + Math.floor(Math.random() * 3);
    state.stickers = Math.random() > 0.25;
    const shuffled = [...SAMPLE_PHOTOS].sort(() => Math.random() - 0.5);
    state.panels.forEach((p, i) => {
      p.src = shuffled[i % shuffled.length].src;
      p.rot = Math.round((Math.random() - 0.5) * 8);
      p.grade = Math.random() > 0.6 ? pick(GRADES).id : null;
      p.zoom = 1 + Math.random() * 0.35;
    });
    pushHistory(); render(); syncInputs();
    const status = $('status');
    if (status) status.textContent = `Surprise #${seed}: ${state.title} · ${state.layout} · ${state.grade}.`;
  }

  function savePreset() {
    try {
      localStorage.setItem(PRESET_KEY, JSON.stringify(state));
      const status = $('status');
      if (status) status.textContent = 'Preset saved in this browser.';
    } catch { /* private mode: saving just does not stick */ }
  }

  function loadPreset() {
    try {
      const raw = localStorage.getItem(PRESET_KEY);
      if (!raw) return false;
      applySnapshot(JSON.parse(raw));
      return true;
    } catch { return false; }
  }

  function bindAll() {
    bindText('titleInput', 'title');
    bindText('subtitleInput', 'subtitle');
    bindText('badgeInput', 'badge');
    bindText('taglineInput', 'tagline');
    bindText('ribbonInput', 'ribbon');
    const heat = $('heatInput');
    if (heat) {
      heat.addEventListener('input', (e) => { state.heat = Number(e.target.value); render(); });
      heat.addEventListener('change', () => pushHistory());
    }
    bindToggle('fillAllToggle', 'fillAll');
    bindToggle('grainToggle', 'grain');
    bindToggle('vignetteToggle', 'vignette');
    bindToggle('halftoneToggle', 'halftone');
    bindToggle('stickersToggle', 'stickers');
    const zoom = $('zoomSlider'), rot = $('rotateSlider');
    if (zoom) {
      zoom.addEventListener('input', (e) => { state.panels[state.selected].zoom = Number(e.target.value); render(); });
      zoom.addEventListener('change', () => pushHistory());
    }
    if (rot) {
      rot.addEventListener('input', (e) => { state.panels[state.selected].rot = Number(e.target.value); render(); });
      rot.addEventListener('change', () => pushHistory());
    }
    const flip = $('flipBtn');
    if (flip) flip.addEventListener('click', () => {
      const p = state.panels[state.selected];
      p.flip = !p.flip; pushHistory(); render();
    });
    const pg = $('panelGrade');
    if (pg) pg.addEventListener('change', (e) => {
      state.panels[state.selected].grade = e.target.value || null;
      pushHistory(); render();
    });
    const cap = $('captionInput');
    if (cap) {
      cap.addEventListener('input', (e) => { state.panels[state.selected].caption = e.target.value; render(); });
      cap.addEventListener('change', () => pushHistory());
    }
    const undoBtn = $('undoBtn'), redoBtn = $('redoBtn');
    if (undoBtn) undoBtn.addEventListener('click', undo);
    if (redoBtn) redoBtn.addEventListener('click', redo);
    const randomBtn = $('randomBtn');
    if (randomBtn) randomBtn.addEventListener('click', randomize);
    const cycleBtn = $('cycleLayoutBtn');
    if (cycleBtn) cycleBtn.addEventListener('click', () => {
      state.layout = cycle(LAYOUTS, state.layout, 1);
      pushHistory(); render(); syncInputs();
    });
    const saveBtn = $('savePresetBtn');
    if (saveBtn) saveBtn.addEventListener('click', savePreset);
    const loadBtn = $('loadPresetBtn');
    if (loadBtn) loadBtn.addEventListener('click', () => {
      if (!loadPreset()) {
        const status = $('status');
        if (status) status.textContent = 'No saved preset yet — hit Save preset first.';
      }
    });
    const resetBtn = $('resetBtn');
    if (resetBtn) resetBtn.addEventListener('click', () => {
      applySnapshot(defaultState());
      pushHistory();
    });
    const exportBtn = $('exportBtn');
    if (exportBtn) exportBtn.addEventListener('click', async () => {
      const status = $('status');
      if (status) status.textContent = 'Exporting all four sizes…';
      const done = await exportAllSizes(state, images, (id, bytes) => {
        if (status) status.textContent = `Exported ${id} (${Math.round(bytes / 1024)} KB)…`;
      });
      if (status) status.textContent = `Exported ${done.length} PNGs — ${EXPORT_SIZES.map((s) => `${s.w}×${s.h}`).join(', ')}.`;
    });
    const upload = $('uploadInput');
    if (upload) upload.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const url = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        images[url] = img;
        state.panels[state.selected].src = url;
        pushHistory(); render(); syncInputs();
        const status = $('status');
        if (status) status.textContent = 'Your photo is in — drag it into place.';
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
    canvas.addEventListener('pointerup', () => { if (drag) { drag = null; pushHistory(); } });
    document.addEventListener('keydown', (e) => {
      const tag = (e.target && e.target.tagName) || '';
      const typing = tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT';
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) { e.preventDefault(); undo(); return; }
      if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.key.toLowerCase() === 'z' && e.shiftKey))) { e.preventDefault(); redo(); return; }
      if (typing) return;
      const p = state.panels[state.selected];
      if (!p) return;
      // Arrow keys nudge the focal point; Shift = 5x step.
      const step = (e.shiftKey ? 0.05 : 0.01);
      if (e.key === 'ArrowLeft') { p.x = Math.max(0, p.x - step); e.preventDefault(); render(); }
      else if (e.key === 'ArrowRight') { p.x = Math.min(1, p.x + step); e.preventDefault(); render(); }
      else if (e.key === 'ArrowUp') { p.y = Math.max(0, p.y - step); e.preventDefault(); render(); }
      else if (e.key === 'ArrowDown') { p.y = Math.min(1, p.y + step); e.preventDefault(); render(); }
      else if (e.key === '[') { state.layout = cycle(LAYOUTS, state.layout, -1); pushHistory(); render(); syncInputs(); }
      else if (e.key === ']') { state.layout = cycle(LAYOUTS, state.layout, 1); pushHistory(); render(); syncInputs(); }
      else if (e.key.toLowerCase() === 'g') { state.grade = cycle(GRADES, state.grade, 1); pushHistory(); render(); syncInputs(); }
    });
  }

  buildPills();
  bindAll();
  syncInputs();
  syncHistoryButtons();
  render();
  return { state, render, undo, redo, syncInputs, randomize, savePreset, loadPreset };
}

export { layoutById, gradeById };
