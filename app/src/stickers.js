// Own vector stickers for NEON PALMS: a palm tree, a setting sun and a
// flamingo, drawn with plain canvas paths. No clip art, no borrowed art.

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

/** Sticker accents along the title band: a striped sun far left (clear of
 *  the title) and a palm at the right edge, behind the badge. */
export function drawStickerRow(ctx, W, bandY, bandH) {
  const s = bandH * 0.62;
  drawSun(ctx, W * 0.018, bandY + bandH * 0.30, bandH * 0.17);
  drawPalm(ctx, W * 0.975, bandY + bandH * 0.95, s * 1.05, '#0d1b1e');
}
