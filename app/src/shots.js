// Fixed scenes for screenshots: ?shot=cover draws the cover alone, full
// frame; ?shot=editor shows the editor with a sample photo loaded. The
// query also picks layout, grade and size so each screenshot can stage a
// different cover. window.__shotReady is set once fonts + photos are in
// and the frame is painted.

import { LAYOUTS } from './panels.js';
import { GRADES } from './grades.js';

const SAMPLES = ['convertible', 'motorcycle', 'diner', 'surfer'];

export function shotParams() {
  const q = new URLSearchParams(location.search);
  return {
    shot: q.get('shot') || '',
    layout: q.get('layout') || 'hero3',
    grade: q.get('grade') || 'vice-sunset',
    size: q.get('size') || 'landscape',
    title: q.get('title') || 'NEON PALMS',
    subtitle: q.get('subtitle') || 'golden hour in Neon Bay',
  };
}

export function shotSize(name) {
  if (name === 'portrait') return { w: 1080, h: 1350 };
  if (name === 'square') return { w: 1080, h: 1080 };
  return { w: 1920, h: 1080 };
}

export function validLayout(id) { return LAYOUTS.some((l) => l.id === id) ? id : 'hero3'; }
export function validGrade(id) { return GRADES.some((g) => g.id === id) ? id : 'vice-sunset'; }

/** Sample photos in cover order for a shot: hero + the other three. */
export function shotPhotos() { return SAMPLES; }

/** Mark the shot done after two animation frames, once paint settled. */
export function markShotReady() {
  requestAnimationFrame(() => requestAnimationFrame(() => { window.__shotReady = true; }));
}
