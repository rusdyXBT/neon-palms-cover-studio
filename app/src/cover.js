// Render engine for NEON PALMS: draws a whole poster cover onto any canvas.
// State shape (see editor.js): { layout, grade, title, subtitle, badge,
// tagline, heat, fillAll, grain, vignette, halftone, stickers, panels: [
// { src, x, y, zoom, rot, flip, grade } ] }. `images` maps src -> HTMLImageElement.

import { layoutPanels } from './panels.js';
import { gradeById, gradedImage } from './grades.js';
import { drawStickerRow } from './stickers.js';

const gradeCache = new Map();
function gradedFor(img, gradeId) {
  const key = `${img.currentSrc || img.src}|${gradeId}`;
  if (!gradeCache.has(key)) gradeCache.set(key, gradedImage(img, gradeId));
  return gradeCache.get(key);
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
function grainPattern() {
  if (grainTile) return grainTile;
  const t = document.createElement('canvas');
  t.width = 160; t.height = 160;
  const c = t.getContext('2d');
  const img = c.createImageData(160, 160);
  const rnd = mulberry32(20261119);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = Math.floor(rnd() * 255);
    img.data[i] = v; img.data[i + 1] = v; img.data[i + 2] = v; img.data[i + 3] = 28;
  }
  c.putImageData(img, 0, 0);
  grainTile = t;
  return t;
}

function fitFont(ctx, text, family, maxW, startSize, weight = '') {
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
  const graded = gradedFor(img, gradeId);
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
  // Inked dark band along the panel foot + white keyline.
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
  // Photo inside the tilted frame: inner is relative to the frame's own
  // top-left, since the context is already rotated into the frame.
  ctx.save();
  ctx.translate(rect.x + rect.w / 2, rect.y + rect.h / 2);
  ctx.rotate((rect.tilt * Math.PI) / 180);
  ctx.translate(-rect.w / 2, -rect.h / 2);
  drawPanelPhoto(ctx, inner, img, panel, gradeId);
  ctx.restore();
}

function starburst(ctx, cx, cy, rOuter, rInner, points = 14) {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? rOuter : rInner;
    const a = (i / (points * 2)) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}

function drawTitleBand(ctx, band, state, W) {
  const { x, y, w, h } = band;
  // Sunset gradient band.
  const grad = ctx.createLinearGradient(x, y, x + w, y);
  grad.addColorStop(0, '#ff5e62');
  grad.addColorStop(0.45, '#ff8a3d');
  grad.addColorStop(0.75, '#e8446b');
  grad.addColorStop(1, '#7a1e6e');
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
  // Top keyline.
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(x, y, w, Math.max(3, h * 0.02));

  // Stickers first, so the lettering draws over them.
  if (state.stickers) drawStickerRow(ctx, W, y, h);

  const pad = w * 0.055;
  const title = (state.title || 'NEON PALMS').toUpperCase();
  // Title: Anton, orange->pink gradient fill, thick black outline.
  const titleSize = fitFont(ctx, title, 'Anton, sans-serif', w * 0.58, h * 0.46);
  const titleGrad = ctx.createLinearGradient(x + pad, 0, x + pad + ctx.measureText(title).width, 0);
  titleGrad.addColorStop(0, '#ffd166');
  titleGrad.addColorStop(0.5, '#ff8a3d');
  titleGrad.addColorStop(1, '#ff5e8a');
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.lineJoin = 'round';
  ctx.lineWidth = Math.max(3, titleSize * 0.09);
  ctx.strokeStyle = '#14041a';
  const titleY = y + h * 0.50;
  ctx.strokeText(title, x + pad, titleY);
  ctx.fillStyle = titleGrad;
  ctx.fillText(title, x + pad, titleY);

  // Subtitle: Pacifico neon script with a pink glow.
  const sub = state.subtitle || '';
  if (sub) {
    const subSize = fitFont(ctx, sub, 'Pacifico, cursive', w * 0.55, h * 0.16);
    ctx.font = `${subSize}px Pacifico, cursive`;
    ctx.shadowColor = '#ff2e88';
    ctx.shadowBlur = subSize * 0.55;
    ctx.fillStyle = '#ffe9f4';
    ctx.fillText(sub, x + pad, y + h * 0.88);
    ctx.shadowBlur = 0;
  }
  // Tagline bar, small caps under the title on the left (clear of the badge).
  const tag = (state.tagline || '').toUpperCase();
  if (tag) {
    const tagSize = fitFont(ctx, tag, 'Anton, sans-serif', w * 0.34, h * 0.11);
    ctx.font = `${tagSize}px Anton, sans-serif`;
    ctx.fillStyle = 'rgba(20,4,24,0.85)';
    const tw = ctx.measureText(tag).width;
    ctx.fillRect(x + pad, y + h * 0.56, tw + h * 0.10, h * 0.16);
    ctx.fillStyle = '#ffd166';
    ctx.fillText(tag, x + pad + h * 0.05, y + h * 0.665);
  }
  // Badge starburst, top-right of the band; text splits on '·' into lines.
  const badge = state.badge || '';
  if (badge) {
    const br = h * 0.46;
    const bcx = x + w - pad - br * 0.95, bcy = y + h * 0.32;
    starburst(ctx, bcx, bcy, br, br * 0.78);
    ctx.fillStyle = '#ffd166';
    ctx.strokeStyle = '#14041a';
    ctx.lineWidth = Math.max(2, br * 0.05);
    ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#14041a';
    ctx.textAlign = 'center';
    const lines = badge.split('·').map((s) => s.trim()).filter(Boolean);
    const bSize = fitFont(ctx, lines.reduce((a, b) => (a.length > b.length ? a : b), ''), 'Anton, sans-serif', br * 1.35, h * 0.085);
    ctx.font = `${bSize}px Anton, sans-serif`;
    const lineH = bSize * 1.15;
    const startY = bcy - ((lines.length - 1) * lineH) / 2 + bSize * 0.35;
    lines.forEach((line, i) => ctx.fillText(line, bcx, startY + i * lineH));
    ctx.textAlign = 'left';
  }
}

/** Draw the full cover onto `canvas` at its own pixel size. */
export function renderCover(canvas, state, images) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;
  ctx.fillStyle = '#14041a';
  ctx.fillRect(0, 0, W, H);
  const { panels, band } = layoutPanels(state.layout, W, H);
  const globalGrade = state.grade || 'vice-sunset';
  const photoAt = (i) => {
    if (state.fillAll) return state.panels[0] || state.panels[i];
    return state.panels[i] || state.panels[0];
  };
  panels.forEach((rect, i) => {
    const panel = photoAt(i);
    if (!panel) return;
    const img = images[panel.src];
    if (!img) return;
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
  // Heat meter as a pill over the top-left corner of the cover.
  const heat = state.heat ?? 4;
  const stars = '★'.repeat(heat) + '☆'.repeat(Math.max(0, 5 - heat));
  const heatText = `HEAT ${stars}`;
  ctx.font = `${Math.round(H * 0.022)}px Anton, sans-serif`;
  const hw = ctx.measureText(heatText).width + H * 0.03;
  const hh = H * 0.045;
  ctx.fillStyle = 'rgba(20,4,24,0.82)';
  ctx.beginPath();
  ctx.roundRect(W * 0.012, H * 0.02, hw, hh, hh / 2);
  ctx.fill();
  ctx.fillStyle = '#ffd166';
  ctx.textAlign = 'left';
  ctx.fillText(heatText, W * 0.012 + H * 0.015, H * 0.02 + hh * 0.72);
  ctx.textAlign = 'left';
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
    const pat = ctx.createPattern(grainPattern(), 'repeat');
    ctx.fillStyle = pat;
    ctx.fillRect(0, 0, W, H);
    ctx.restore();
  }
  return { panels, band };
}

export { gradeById };
