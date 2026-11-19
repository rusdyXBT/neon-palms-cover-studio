// Gradient-map grades for NEON PALMS: each grade maps a photo's luminance
// through a sunset/neon colour ramp, then blends back toward the original
// so faces and chrome keep their colour. All math is plain canvas ImageData.

export const GRADES = [
  { id: 'vice-sunset', name: 'Vice Sunset', strength: 0.72,
    stops: [[0, '#1b0b2e'], [0.28, '#7a1e6e'], [0.55, '#e8446b'], [0.78, '#ff8a3d'], [1, '#ffd166']] },
  { id: 'neon-nights', name: 'Neon Nights', strength: 0.78,
    stops: [[0, '#050914'], [0.3, '#7b2ff7'], [0.55, '#ff2e88'], [0.8, '#22e6d6'], [1, '#eafffb']] },
  { id: 'golden-hour', name: 'Golden Hour', strength: 0.62,
    stops: [[0, '#241208'], [0.3, '#7a3b12'], [0.55, '#d97b2b'], [0.8, '#ffb347'], [1, '#fff3c4']] },
  { id: 'palm-noir', name: 'Palm Noir', strength: 0.85,
    stops: [[0, '#000000'], [0.35, '#232323'], [0.6, '#8a8a8a'], [0.85, '#e8e8e8'], [1, '#ffffff']] },
  { id: 'heat-haze', name: 'Heat Haze', strength: 0.66,
    stops: [[0, '#12041f'], [0.3, '#5b1a5e'], [0.55, '#c94b6d'], [0.8, '#ff9e57'], [1, '#fff0a8']] },
  { id: 'dusk-purple', name: 'Dusk Purple', strength: 0.74,
    stops: [[0, '#0a0618'], [0.3, '#3d1a6e'], [0.55, '#8b2fb8'], [0.8, '#e86aa8'], [1, '#ffe3f2']] },
];

export function gradeById(id) {
  return GRADES.find((g) => g.id === id) || GRADES[0];
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function buildLut(grade) {
  const stops = grade.stops.map(([t, hex]) => [t, hexToRgb(hex)]);
  const lut = new Uint8Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const t = i / 255;
    let a = stops[0], b = stops[stops.length - 1];
    for (let s = 0; s < stops.length - 1; s++) {
      if (t >= stops[s][0] && t <= stops[s + 1][0]) { a = stops[s]; b = stops[s + 1]; break; }
    }
    const span = b[0] - a[0] || 1;
    const k = Math.max(0, Math.min(1, (t - a[0]) / span));
    for (let c = 0; c < 3; c++) lut[i * 3 + c] = Math.round(a[1][c] + (b[1][c] - a[1][c]) * k);
  }
  return lut;
}

const lutCache = new Map();

/** Grade an ImageData in place with a named gradient map. */
export function applyGrade(imageData, gradeId) {
  const grade = gradeById(gradeId);
  if (!lutCache.has(grade.id)) lutCache.set(grade.id, buildLut(grade));
  const lut = lutCache.get(grade.id);
  const d = imageData.data;
  const s = grade.strength;
  for (let i = 0; i < d.length; i += 4) {
    const lum = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2]);
    const o = lum * 3;
    d[i] = Math.round(d[i] * (1 - s) + lut[o] * s);
    d[i + 1] = Math.round(d[i + 1] * (1 - s) + lut[o + 1] * s);
    d[i + 2] = Math.round(d[i + 2] * (1 - s) + lut[o + 2] * s);
  }
  return imageData;
}

/** Grade a whole source image into a fresh canvas of the same size. */
export function gradedImage(img, gradeId, maxSide = 1600) {
  const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(2, Math.round(img.naturalWidth * scale));
  const h = Math.max(2, Math.round(img.naturalHeight * scale));
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const ctx = c.getContext('2d');
  ctx.drawImage(img, 0, 0, w, h);
  const data = ctx.getImageData(0, 0, w, h);
  applyGrade(data, gradeId);
  ctx.putImageData(data, 0, 0);
  return c;
}
