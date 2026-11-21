// Own vector stickers for NEON PALMS round 3: a palm tree, a setting sun,
// a flamingo, a star and a wave, drawn with plain canvas paths. No clip
// art, no borrowed art.
//
// Round 3: drawBadgeRays (radiating rays behind the badge starburst),
// drawStar (four-point sparkle) and drawWave (a small surf wave) are new,
// and the title-band sticker row now ends with a flamingo on the left and
// sparkles scattered along the band.

/** Draw a palm silhouette centred at (cx, cy) with trunk height h. */
export function drawPalm(ctx, cx, cy, h, color = '#0d1b1e') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = color;
  ctx.strokeStyle = color;
  // Trunk: a gentle curve, thicker at the base.
  ctx.beginPath();
  ctx.moveTo(-h * 0.035, 0);
  ctx.quadraticCurveTo(-h * 0.02, -h * 0.55, h * 0.05, -h * 0.92);
  ctx.quadraticCurveTo(h * 0.09, -h * 0.55, h * 0.045, 0);
  ctx.closePath();
  ctx.fill();
  // Fronds: seven arcs fanning from the crown.
  const crownY = -h * 0.92;
  ctx.lineWidth = h * 0.035;
  ctx.lineCap = 'round';
  for (let i = 0; i < 7; i++) {
    const a = (-165 + i * 27.5) * (Math.PI / 180);
    const len = h * (0.42 - Math.abs(i - 3) * 0.03);
    const ex = h * 0.05 + Math.cos(a) * len;
    const ey = crownY + Math.sin(a) * len * 0.55 + len * 0.28;
    ctx.beginPath();
    ctx.moveTo(h * 0.05, crownY);
    ctx.quadraticCurveTo(h * 0.05 + Math.cos(a) * len * 0.6, crownY + Math.sin(a) * len * 0.3, ex, ey);
    ctx.stroke();
  }
  // Coconuts.
  ctx.beginPath(); ctx.arc(h * 0.02, crownY + h * 0.03, h * 0.03, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath(); ctx.arc(h * 0.09, crownY + h * 0.04, h * 0.028, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

/** Draw a striped setting sun: a disc with horizontal slices cut out. */
export function drawSun(ctx, cx, cy, r, top = '#ffcf3f', bottom = '#ff5e62') {
  ctx.save();
  const grad = ctx.createLinearGradient(0, cy - r, 0, cy + r);
  grad.addColorStop(0, top);
  grad.addColorStop(1, bottom);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // Slice the lower half into sunset stripes.
  ctx.globalCompositeOperation = 'destination-out';
  for (let i = 0; i < 4; i++) {
    const y = cy + r * (0.08 + i * 0.22);
    ctx.fillRect(cx - r, y, r * 2, r * 0.055);
  }
  ctx.restore();
}

/** Draw a simple flamingo in profile, standing on one leg. */
export function drawFlamingo(ctx, cx, cy, h, color = '#ff5e8a') {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = h * 0.045;
  ctx.lineCap = 'round';
  // Neck: S-curve up from the body.
  ctx.beginPath();
  ctx.moveTo(0, -h * 0.42);
  ctx.bezierCurveTo(h * 0.16, -h * 0.55, h * 0.20, -h * 0.78, h * 0.08, -h * 0.88);
  ctx.stroke();
  // Head + beak.
  ctx.beginPath(); ctx.arc(h * 0.06, -h * 0.88, h * 0.055, 0, Math.PI * 2); ctx.fill();
  ctx.beginPath();
  ctx.moveTo(h * 0.10, -h * 0.87);
  ctx.lineTo(h * 0.24, -h * 0.83);
  ctx.lineTo(h * 0.10, -h * 0.80);
  ctx.closePath(); ctx.fillStyle = '#1c1c22'; ctx.fill();
  // Body: a plump teardrop.
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.ellipse(0, -h * 0.30, h * 0.22, h * 0.15, -0.25, 0, Math.PI * 2);
  ctx.fill();
  // Wing.
  ctx.fillStyle = '#e83e6f';
  ctx.beginPath();
  ctx.ellipse(-h * 0.02, -h * 0.30, h * 0.15, h * 0.09, -0.25, 0, Math.PI * 2);
  ctx.fill();
  // Legs: one straight, one folded.
  ctx.strokeStyle = color;
  ctx.beginPath(); ctx.moveTo(0, -h * 0.16); ctx.lineTo(0, 0); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -h * 0.16); ctx.lineTo(h * 0.10, -h * 0.05); ctx.lineTo(h * 0.10, 0); ctx.stroke();
  ctx.restore();
}

/** Four-point sparkle star, for scattering along the title band. */
export function drawStar(ctx, cx, cy, r, color = '#ffd166') {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - r);
  ctx.quadraticCurveTo(cx, cy, cx + r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy + r);
  ctx.quadraticCurveTo(cx, cy, cx - r, cy);
  ctx.quadraticCurveTo(cx, cy, cx, cy - r);
  ctx.fill();
  ctx.restore();
}

/** A small surf wave: two stacked arcs with a foam crest. */
export function drawWave(ctx, cx, cy, w, color = '#22e6d6') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = Math.max(2, w * 0.08);
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy);
  ctx.quadraticCurveTo(cx - w * 0.2, cy - w * 0.3, cx + w * 0.15, cy - w * 0.12);
  ctx.quadraticCurveTo(cx + w * 0.35, cy, cx + w / 2, cy - w * 0.18);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.35, cy + w * 0.16);
  ctx.quadraticCurveTo(cx, cy + w * 0.02, cx + w * 0.4, cy + w * 0.12);
  ctx.stroke();
  ctx.restore();
}

/** Radiating rays behind the badge starburst, alternating long/short. */
export function drawBadgeRays(ctx, cx, cy, rOuter, rInner, color = '#ffd166') {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.globalAlpha = 0.55;
  ctx.lineWidth = Math.max(2, rOuter * 0.03);
  ctx.lineCap = 'round';
  const rays = 12;
  for (let i = 0; i < rays; i++) {
    const a = (i / rays) * Math.PI * 2;
    const r1 = rInner;
    const r2 = i % 2 === 0 ? rOuter : (rOuter + rInner) / 2;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2);
    ctx.stroke();
  }
  ctx.restore();
}

/** Sticker accents along the title band: a striped sun far left, a
 *  flamingo low-left, a palm at the right edge behind the badge, and
 *  sparkles scattered between title and badge. */
export function drawStickerRow(ctx, W, bandY, bandH) {
  const s = bandH * 0.62;
  drawSun(ctx, W * 0.018, bandY + bandH * 0.30, bandH * 0.17);
  drawFlamingo(ctx, W * 0.055, bandY + bandH * 0.92, bandH * 0.34, '#ff5e8a');
  drawPalm(ctx, W * 0.975, bandY + bandH * 0.95, s * 1.05, '#0d1b1e');
  drawStar(ctx, W * 0.62, bandY + bandH * 0.18, bandH * 0.05);
  drawStar(ctx, W * 0.68, bandY + bandH * 0.78, bandH * 0.035);
  drawWave(ctx, W * 0.72, bandY + bandH * 0.85, bandH * 0.22);
}
