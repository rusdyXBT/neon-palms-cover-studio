// Fixed scenes for screenshots: ?shot=cover draws the cover alone, full
// frame; ?shot=editor shows the editor with a sample photo loaded. The
// query also picks layout, grade, size, title, subtitle, ribbon and heat
// so each screenshot can stage a different cover. window.__shotReady is
// set once fonts + photos are in and the frame is painted.
//
// Round 3: ribbon + heat + badge + tagline are now URL-addressable too,
// the default layout/grade follow the round-3 spec (boulevard /
// vice-dusk), and shotSize knows the new story size.

import { LAYOUTS } from './panels.js';
import { GRADES } from './grades.js';

const SAMPLES = ['convertible', 'motorcycle', 'diner', 'surfer'];

export const SHOT_SIZES = {
  square: { w: 1080, h: 1080 },
  portrait: { w: 1080, h: 1350 },
  landscape: { w: 1920, h: 1080 },
  story: { w: 1080, h: 1920 },
};

export function shotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || '',
    layout: q.get('layout') || 'boulevard',
    grade: q.get('grade') || 'vice-dusk',
    size: q.get('size') || 'landscape',
    title: q.get('title') || 'NEON PALMS',
    subtitle: q.get('subtitle') || 'dusk falls on Neon Bay',
    ribbon: q.get('ribbon') || 'VICE DUSK · 2026',
    badge: q.get('badge') || 'EST. 2026 · NEON BAY',
    tagline: q.get('tagline') || 'EVERY STREET IS A STAGE',
    heat: validHeat(q.get('heat')),
  };
}

export function shotSize(name) {
  return SHOT_SIZES[name] || SHOT_SIZES.landscape;
}

export function validLayout(id) { return LAYOUTS.some((l) => l.id === id) ? id : 'boulevard'; }
export function validGrade(id) { return GRADES.some((g) => g.id === id) ? id : 'vice-dusk'; }

/** Clamp the heat query param to 0..5; default 5 (round-3 spec). */
export function validHeat(raw) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return 5;
  return Math.max(0, Math.min(5, Math.round(n)));
}

/** Sample photos in cover order for a shot: hero + the other four. */
export function shotPhotos() { return SAMPLES; }

/** Mark the shot done after two animation frames, once paint settled. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
