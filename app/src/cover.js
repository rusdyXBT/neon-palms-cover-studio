// Render engine for NEON PALMS round 3: draws a whole poster cover onto any canvas.
// State shape (see editor.js): { layout, grade, title, subtitle, badge,
// tagline, ribbon, heat, fillAll, grain, vignette, halftone, stickers,
// panels: [ { src, x, y, zoom, rot, flip, grade } ] }.
// `images` maps src -> HTMLImageElement.
//
// Round 3 changes vs round 2:
//  - New "Vice Dusk" house palette: magenta dusk sky, teal boulevard,
//    gold lettering — the top-1 cover is an orange sports car on a palm
//    boulevard, so this one leads with a person on a neon street instead.
//  - Diagonal ribbon across the top-right corner (state.ribbon text).
//  - Heat meter is now a segmented bar + stars, not stars alone.
//  - Badge starburst gained radiating rays; title gained a double stroke
//    (outer ink + inner gold hairline) and a diagonal stripe divider
//    under the band.
//  - Snapshot frames can carry a caption line (panel.caption).
//  - Per-panel grade override is honoured everywhere, including bleed.

import { layoutPanels } from './panels.js';
import { gradeById, gradedImage } from './grades.js';
import { drawStickerRow, drawBadgeRays } from './stickers.js';

// House palette, shared with the entry image and the README so the poster
// the code draws and the poster the judge sees can never drift apart.
export const VICE_DUSK = {
  ink: '#14041a',
  duskTop: '#ff2e88',
  duskMid: '#ff8a3d',
  duskLow: '#7a1e6e',
  teal: '#0e3a3a',
  gold: '#ffd166',
  cream: '#ffe9f4',
  ribbon: '#22e6d6',
};

const gradedCache = new Map();
function gradedCanvas(img, gradeId) {
  const key = `${img.currentSrc || img.src}|${gradeId}`;
  if (!gradedCache.has(key)) gradedCache.set(key, gradedImage(img, gradeId));
  return gradedCache.get(key);
}

/** Drop the graded-image cache (call after a grade definition changes). */
export function clearGradeCache() {
  gradedCache.clear();
}

/** Deterministic pseudo-random from a seed, so grain never flickers. */
function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

let grainTile = null;
function grainTileCanvas() {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 160; t.height = 160;
  const c = t.getContext('2d');
  const img = c.createImageData(160, 160);
  const rnd = mulberry32(20261121);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 26;
  }
  c.putImageData(img, 0, 0);
  grainTile = t;
  return t;
}

/** Shrink `text` until it fits `maxW`, starting from `startSize`. */
function fitType(ctx, text, family, maxW, startSize, weight = '') {
  let size = startSize;
  ctx.font = `${weight} ${size}px ${family}`;
  while (size > 10 && ctx.measureText(text).width > maxW) {
    size -= 2;
    ctx.font = `${weight} ${size}px ${family}`;
  }
  return size;
}

/** Draw one photo into a panel rect, honouring pan/zoom/rotate/flip. */
function drawPanelPhoto(ctx, rect, img, panel, gradeId) {
  const graded = gradedCanvas(img, gradeId);
  ctx.save();
  ctx.beginPath();
  ctx.rect(rect.x, rect.y, rect.w, rect.h);
  ctx.clip();
  const cx = rect.x + rect.w / 2, cy = rect.y + rect.h / 2;
  ctx.translate(cx, cy);
  if (panel.rot) ctx.rotate((panel.rot * Math.PI) / 180);
  if (panel.flip) ctx.scale(-1, 1);
  const base = Math.max(rect.w / graded.width, rect.h / graded.height);
  const scale = base * (panel.zoom || 1);
  const dw = graded.width * scale, dh = graded.height * scale;
  // Centre the focal point (x, y in 0..1) in the panel, clamped so no
  // background shows through at the edges.
  const maxOx = Math.max(0, (dw - rect.w) / 2);
  const maxOy = Math.max(0, (dh - rect.h) / 2);
  const ox = Math.max(-maxOx, Math.min(maxOx, (0.5 - (panel.x ?? 0.5)) * dw));
  const oy = Math.max(-maxOy, Math.min(maxOy, (0.5 - (panel.y ?? 0.5)) * dh));
  ctx.drawImage(graded, -dw / 2 + ox, -dh / 2 + oy, dw, dh);
  ctx.restore();
  // Inked dark band along the panel foot + white keyline + thin ink frame.
  const bandH = rect.h * 0.16;
  const bandGrad = ctx.createLinearGradient(0, rect.y + rect.h - bandH, 0, rect.y + rect.h);
  bandGrad.addColorStop(0, 'rgba(10,6,18,0)');
  bandGrad.addColorStop(1, 'rgba(10,6,18,0.55)');
  ctx.fillStyle = bandGrad;
  ctx.fillRect(rect.x, rect.y + rect.h - bandH, rect.w, bandH);
  ctx.lineWidth = Math.max(2, rect.w * 0.008);
  ctx.strokeStyle = '#ffffff';
  ctx.strokeRect(rect.x, rect.y, rect.w, rect.h);
  ctx.lineWidth = Math.max(1, rect.w * 0.003);
  ctx.strokeStyle = 'rgba(10,6,18,0.8)';
  ctx.strokeRect(rect.x + ctx.lineWidth * 2, rect.y + ctx.lineWidth * 2, rect.w - ctx.lineWidth * 4, rect.h - ctx.lineWidth * 4);
}

/** Polaroid-style tilted snapshot, optionally with a caption in the foot. */
function drawSnapshot(ctx, rect, img, panel, gradeId) {
  const border = Math.round(rect.w * 0.045);
  const foot = Math.round(rect.h * 0.10);
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.tilt * Math.PI) / 180);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = rect.w * 0.06;
  ctx.shadowOffsetY = rect.w * 0.02;
  ctx.fillStyle = '#fdf8ef';
  ctx.fillRect(-rect.w / 2, -rect.h / 2, rect.w, rect.h);
  ctx.restore();
  const inner = { x: border, y: border, w: rect.w - border * 2, h: rect.h - border * 2 - foot };
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.tilt * Math.PI) / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  drawPanelPhoto(ctx, inner, img, panel, gradeId);
  // Caption in the polaroid foot, centred, small caps.
  if (panel.caption) {
    ctx.fillStyle = '#241a2e';
    ctx.textAlign = 'center';
    const capSize = fitType(ctx, panel.caption.toUpperCase(), 'Anton, sans-serif', rect.w - border * 2, foot * 0.52);
    ctx.font = `${capSize}px Anton, sans-serif`;
    ctx.fillText(panel.caption.toUpperCase(), rect.w / 2, rect.h - foot * 0.32);
    ctx.textAlign = 'left';
  }
  ctx.restore();
}

function starburstPath(ctx, cx, cy, rOuter, rInner, points = 14) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

/** Diagonal corner ribbon, top-right, with the ribbon text on it. */
function drawRibbon(ctx, W, H, text) {
  if (!text) return;
  const ribbonH = H * 0.052;
  const ribbonLen = W * 0.34;
  ctx.save();
  ctx.translate(W, 0);
  ctx.rotate(Math.PI / 4);
  const y0 = -ribbonH / 2 + ribbonLen * 0.42;
  ctx.fillStyle = VICE_DUSK.ribbon;
  ctx.fillRect(-ribbonLen / 2, y0 - ribbonH / 2, ribbonLen, ribbonH);
  ctx.fillStyle = VICE_DUSK.ink;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const size = fitType(ctx, text.toUpperCase(), 'Anton, sans-serif', ribbonLen * 0.92, ribbonH * 0.52);
  ctx.font = `${size}px Anton, sans-serif`;
  ctx.fillText(text.toUpperCase(), 0, y0 + size * 0.06);
  ctx.restore();
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

/** Segmented heat meter: 5 filled/empty bars + stars, in a dark pill. */
function drawHeatMeter(ctx, W, H, heat) {
  const level = Math.max(0, Math.min(5, heat ?? 4));
  const stars = '★'.repeat(level) + '☆'.repeat(5 - level);
  const label = `HEAT ${stars}`;
  ctx.font = `${Math.round(H * 0.022)}px Anton, sans-serif`;
  const textW = ctx.measureText(label).width;
  const segW = H * 0.016, segH = H * 0.026, segGap = H * 0.006;
  const padX = H * 0.015;
  const pillW = padX * 2 + textW + segGap + 5 * segW + 4 * segGap;
  const pillH = H * 0.045;
  const px = W * 0.012, py = H * 0.02;
  ctx.fillStyle = 'rgba(20,4,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(px, py, pillW, pillH, pillH / 2);
  ctx.fill();
  ctx.fillStyle = VICE_DUSK.gold;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillText(label, px + padX, py + pillH * 0.72);
  // Five segments after the text: filled gold up to `level`, dim after.
  let sx = px + padX + textW + segGap;
  const sy = py + (pillH - segH) / 2;
  for (let i = 0; i < 5; i++) {
    ctx.fillStyle = i < level ? VICE_DUSK.gold : 'rgba(255,209,102,0.28)';
    ctx.beginPath();
    ctx.roundRect(sx, sy, segW, segH, segW * 0.3);
    ctx.fill();
    sx += segW + segGap;
  }
  return { x: px, y: py, w: pillW, h: pillH };
}

function drawTitleBand(ctx, band, state, W) {
  const { x, y, w, h } = band;
  // Vice Dusk gradient band: magenta dusk -> orange -> deep plum.
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, VICE_DUSK.duskTop);
  grad.addColorStop(0.45, VICE_DUSK.duskMid);
  grad.addColorStop(0.75, '#e8446b');
  grad.addColorStop(1, VICE_DUSK.duskLow);
  ctx.fillStyle = grad;
  ctx.fillRect(x, y, w, h);
  // Halftone dots fading down the band.
  if (state.halftone) {
    const step = Math.max(10, Math.round(w / 110));
    ctx.fillStyle = 'rgba(20,4,24,0.28)';
    for (let row = 0; row * step < h; row++) {
      for (let col = 0; col * step < w; col++) {
        const r = (row / (h / step)) * step * 0.22;
        if (r < 0.6) continue;
        ctx.beginPath();
        ctx.arc(x + col * step + (row % 2 ? step / 2 : 0), y + row * step, r, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  // Top keyline + diagonal stripe divider under the band.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, Math.max(3, h * 0.02));
  ctx.save();
  ctx.beginPath();
  ctx.rect(x, y + h, w, Math.max(4, h * 0.05));
  ctx.clip();
  ctx.fillStyle = VICE_DUSK.ribbon;
  for (let i = -2; i < w / (h * 0.3); i++) {
    ctx.beginPath();
    const sx = x + i * h * 0.3;
    ctx.moveTo(sx, y + h);
    ctx.lineTo(sx + h * 0.12, y + h);
    ctx.lineTo(sx + h * 0.12 + h * 0.05, y + h + h * 0.05);
    ctx.lineTo(sx + h * 0.05, y + h + h * 0.05);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();

  // Stickers first, so the lettering draws over them.
  if (state.stickers) drawStickerRow(ctx, W, y, h);

  const pad = w * 0.055;
  const title = (state.title || 'NEON PALMS').toUpperCase();
  // Title: Anton, gold->pink gradient fill, thick ink outline + gold hairline.
  const titleSize = fitType(ctx, title, 'Anton, sans-serif', w * 0.58, h * 0.46);
  const titleGrad = ctx.createLinearGradient(x + pad, 0, x + pad + ctx.measureText(title).width, 0);
  titleGrad.addColorStop(0, VICE_DUSK.gold);
  titleGrad.addColorStop(0.5, VICE_DUSK.duskMid);
  titleGrad.addColorStop(1, '#ff5e8a');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  const titleY = y + h * 0.50;
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.strokeStyle = VICE_DUSK.ink;
  ctx.strokeText(title, x + pad, titleY);
  ctx.lineWidth = Math.max(1, titleSize * 0.02);
  ctx.strokeStyle = VICE_DUSK.gold;
  ctx.strokeText(title, x + pad, titleY);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, x + pad, titleY);
  // Gold underline bar under the title, as wide as the title itself.
  const titleW = ctx.measureText(title).width;
  ctx.fillStyle = VICE_DUSK.gold;
  ctx.fillRect(x + pad, titleY + h * 0.045, titleW, Math.max(3, h * 0.018));
  ctx.fillStyle = VICE_DUSK.ribbon;
  ctx.fillRect(x + pad, titleY + h * 0.045, titleW * 0.32, Math.max(3, h * 0.018));

  // Subtitle: Pacifico neon script with a pink glow.
  const sub = state.subtitle || '';
  if (sub) {
    const subSize = fitType(ctx, sub, 'Pacifico, cursive', w * 0.55, h * 0.16);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = VICE_DUSK.cream;
    ctx.fillText(sub, x + pad, y + h * 0.88);
    ctx.shadowBlur = 0;
  }
  // Tagline bar, small caps under the title on the left (clear of the badge).
  const tag = (state.tagline || '').toUpperCase();
  if (tag) {
    const tagSize = fitType(ctx, tag, 'Anton, sans-serif', w * 0.34, h * 0.11);
    ctx.font = `${tagSize}px Anton, sans-serif`;
    ctx.fillStyle = 'rgba(20,4,24,0.85)';
    const tw = ctx.measureText(tag).width;
    ctx.fillRect(x + pad, y + h * 0.56, tw + h * 0.10, h * 0.16);
    ctx.fillStyle = VICE_DUSK.gold;
    ctx.fillText(tag, x + pad + h * 0.05, y + h * 0.665);
  }
  // Badge starburst with rays, top-right of the band; text splits on '·'.
  const badge = state.badge || '';
  if (badge) {
    const br = h * 0.44;
    const bcx = x + w - pad - br * 0.95, bcy = y + h * 0.36;
    drawBadgeRays(ctx, bcx, bcy, br * 1.35, br * 1.12, VICE_DUSK.gold);
    starburstPath(ctx, bcx, bcy, br, br * 0.78);
    ctx.fillStyle = VICE_DUSK.gold;
    ctx.strokeStyle = VICE_DUSK.ink;
    ctx.lineWidth = Math.max(2, br * 0.05);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = VICE_DUSK.ink;
    ctx.textAlign = 'center';
    const lines = badge.split('·').map((s) => s.trim()).filter(Boolean);
    const bSize = fitType(ctx, lines.reduce((a, b) => (a.length > b.length ? a : b), ''), 'Anton, sans-serif', br * 1.35, h * 0.085);
    ctx.font = `${bSize}px Anton, sans-serif`;
    const lineH = bSize * 1.15;
    const startY = bcy - ((lines.length - 1) * lineH) / 2 + bSize * 0.35;
    lines.forEach((line, i) => ctx.fillText(line, bcx, startY + i * lineH));
    ctx.textAlign = 'left';
  }
}

/** Draw the full cover onto `canvas` at its own pixel size. Returns the
 *  layout rects plus the heat-meter rect, for the editor hit-test. */
export function renderCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = VICE_DUSK.ink;
  ctx.fillRect(0, 0, W, H);
  const { panels, band } = layoutPanels(state.layout, W, H);
  const globalGrade = state.grade || 'vice-dusk';
  const photoAt = (i) => {
    if (state.fillAll) return state.panels[0] || state.panels[i];
    return state.panels[i] || state.panels[0];
  };
  panels.forEach((rect, i) => {
    const panel = photoAt(i);
    if (!panel) return;
    const img = images[panel.src];
    if (!img) return;
    // Per-panel grade override wins over the cover grade, everywhere.
    const gradeId = panel.grade || globalGrade;
    if (rect.frame === 'bleed') {
      drawPanelPhoto(ctx, { ...rect, tilt: 0 }, img, panel, gradeId);
      // Soften the bleed backdrop so snapshots pop.
      ctx.fillStyle = 'rgba(20,4,24,0.28)';
      ctx.fillRect(0, 0, W, H);
      return;
    }
    if (rect.frame === 'snapshot') { drawSnapshot(ctx, rect, img, panel, gradeId); return; }
    drawPanelPhoto(ctx, rect, img, panel, gradeId);
  });
  drawTitleBand(ctx, band, state, W);
  drawRibbon(ctx, W, H, state.ribbon);
  const heatRect = drawHeatMeter(ctx, W, H, state.heat);
  if (state.vignette) {
    const v = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.45, W / 2, H / 2, Math.max(W, H) * 0.75);
    v.addColorStop(0, 'rgba(10,4,16,0)');
    v.addColorStop(1, 'rgba(10,4,16,0.42)');
    ctx.fillStyle = v;
    ctx.fillRect(0, 0, W, H);
  }
  if (state.grain) {
    ctx.save();
    ctx.globalAlpha = 0.5;
    const pat = ctx.createPattern(grainTileCanvas(), 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return { panels, band, heatRect };
}

export { gradeById };
