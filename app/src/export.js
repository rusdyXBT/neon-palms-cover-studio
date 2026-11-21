// PNG export for NEON PALMS round 3: renders the cover at all four post
// sizes and downloads them in one click. Pure canvas, no network.
//
// Round 3: a fourth size — Story 1080 × 1920 — plus a single-size export
// (exportOneSize) so the editor can offer "just the landscape" without
// re-rendering everything, and v3 filenames so a round-2 download can
// never be mistaken for a round-3 one.

import { renderCover } from './cover.js';

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080, file: 'neon-palms-v3-square.png' },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350, file: 'neon-palms-v3-portrait.png' },
  { id: 'landscape', label: 'Landscape 1920 × 1080', w: 1920, h: 1080, file: 'neon-palms-v3-landscape.png' },
  { id: 'story', label: 'Story 1080 × 1920', w: 1080, h: 1920, file: 'neon-palms-v3-story.png' },
];

export function sizeById(id) {
  return EXPORT_SIZES.find((s) => s.id === id) || EXPORT_SIZES[2];
}

/** Render one size off-screen and return a PNG blob. */
export function renderSize(state, images, size) {
  const c = document.createElement('canvas');
  c.width = size.w; c.height = size.h;
  renderCover(c, state, images);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

function downloadBlob(blob, file) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = file;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  return blob.size;
}

/** Render + download a single size; returns { …size, bytes }. */
export async function exportOneSize(state, images, sizeId) {
  const size = sizeById(sizeId);
  const blob = await renderSize(state, images, size);
  const bytes = downloadBlob(blob, size.file);
  return { ...size, bytes };
}

/** Render all four sizes and trigger a download for each. */
export async function exportAllSizes(state, images, onProgress) {
  const results = [];
  for (const size of EXPORT_SIZES) {
    const blob = await renderSize(state, images, size);
    const bytes = downloadBlob(blob, size.file);
    results.push({ ...size, bytes });
    if (onProgress) onProgress(size.id, bytes);
  }
  return results;
}
