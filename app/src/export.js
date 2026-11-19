// PNG export for NEON PALMS: renders the cover at all three post sizes and
// downloads them in one click. Pure canvas, no network.

import { renderCover } from './cover.js';

export const EXPORT_SIZES = [
  { id: 'square', label: 'Square 1080 × 1080', w: 1080, h: 1080, file: 'neon-palms-square.png' },
  { id: 'portrait', label: 'Portrait 1080 × 1350', w: 1080, h: 1350, file: 'neon-palms-portrait.png' },
  { id: 'landscape', label: 'Landscape 1920 × 1080', w: 1920, h: 1080, file: 'neon-palms-landscape.png' },
];

/** Render one size off-screen and return a PNG blob. */
export function renderSize(state, images, size) {
  const c = document.createElement('canvas');
  c.width = size.w; c.height = size.h;
  renderCover(c, state, images);
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

/** Render all three sizes and trigger a download for each. */
export async function exportAllSizes(state, images, onProgress) {
  const results = [];
  for (const size of EXPORT_SIZES) {
    const blob = await renderSize(state, images, size);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = size.file;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
    results.push({ ...size, bytes: blob.size });
    if (onProgress) onProgress(size.id, blob.size);
  }
  return results;
}
