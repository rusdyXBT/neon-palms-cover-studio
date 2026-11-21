// Panel layouts for NEON PALMS round 3. Every layout returns panel rects in
// cover pixels plus a title-band rect and a tilt (degrees) per panel, so the
// render engine and the editor hit-test share one source of truth.
//
// Round 3: two new layouts — Boulevard (wide hero on top, three snapshots
// in a strip below; the round-3 default, built for a person-hero street
// scene) and Skyline (tall hero left, two stacked right, wide bottom
// band). The title band is taller on Boulevard/Skyline (0.26 of H) so the
// ribbon + badge + tagline all fit without crowding.

export const LAYOUTS = [
  { id: 'boulevard', name: 'Boulevard', panels: 4, bandH: 0.26 },
  { id: 'skyline', name: 'Skyline', panels: 3, bandH: 0.26 },
  { id: 'hero3', name: 'Hero + 3', panels: 4, bandH: 0.235 },
  { id: 'grid4', name: '4-Panel Grid', panels: 4, bandH: 0.235 },
  { id: 'grid9', name: '9-Panel Grid', panels: 9, bandH: 0.235 },
  { id: 'fullbleed', name: 'Full-Bleed Hero', panels: 1, bandH: 0.235 },
  { id: 'tilted', name: 'Tilted Snapshots', panels: 3, bandH: 0.235 },
  { id: 'duotone', name: 'Duotone Split', panels: 2, bandH: 0.235 },
  { id: 'comic', name: 'Comic Bands', panels: 4, bandH: 0.235 },
  { id: 'storystrip', name: 'Story Strip', panels: 4, bandH: 0.235 },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/** How many panels a layout expects (editor uses it for the pill hint). */
export function panelsForLayout(id) {
  return layoutById(id).panels;
}

function bandFor(layoutId, H) {
  const titleH = Math.round(H * (layoutById(layoutId).bandH ?? 0.235));
  return { x: 0, y: H - titleH, w: 0, h: titleH };
}

/**
 * Panel rects for a cover of W x H. Each rect: {x, y, w, h, tilt, frame}
 * (frame 'snapshot' draws a white polaroid border, 'plain' a keyline,
 * 'bleed' a full-bleed backdrop). The title band sits across the bottom
 * and overlaps the panels, poster-style.
 */
export function layoutPanels(layoutId, W, H) {
  const g = Math.max(6, Math.round(W * 0.006)); // keyline gap
  const band = bandFor(layoutId, H);
  band.w = W;
  const rect = (x, y, w, h, tilt = 0, frame = 'plain') => ({ x, y, w, h, tilt, frame });
  switch (layoutId) {
    case 'boulevard': {
      // Wide hero across the top (the person on the neon street), then
      // three tilted snapshots in a strip above the title band.
      const heroH = Math.round((H - band.h) * 0.58);
      const stripY = heroH + g;
      const stripH = H - band.h - stripY - g;
      const sw = (W - g * 4) / 3;
      return {
        panels: [
          rect(g, g, W - g * 2, heroH - g),
          rect(g, stripY, sw, stripH, -3, 'snapshot'),
          rect(g * 2 + sw, stripY, sw, stripH, 2, 'snapshot'),
          rect(g * 3 + sw * 2, stripY, sw, stripH, -2, 'snapshot'),
        ],
        band,
      };
    }
    case 'skyline': {
      // Tall hero left, two stacked panels right, wide bottom band.
      const heroW = Math.round(W * 0.58);
      const sideW = W - heroW - g * 2;
      const sh = (H - band.h - g * 3) / 2;
      return {
        panels: [
          rect(g, g, heroW - g, H - band.h - g * 2),
          rect(heroW + g, g, sideW, sh),
          rect(heroW + g, g * 2 + sh, sideW, sh),
        ],
        band,
      };
    }
    case 'grid4': {
      const cw = (W - g * 3) / 2, ch = (H - g * 3) / 2;
      return { panels: [rect(g, g, cw, ch), rect(g * 2 + cw, g, cw, ch), rect(g, g * 2 + ch, cw, ch), rect(g * 2 + cw, g * 2 + ch, cw, ch)], band };
    }
    case 'grid9': {
      const cw = (W - g * 4) / 3, ch = (H - g * 4) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out.push(rect(g + c * (cw + g), g + r * (ch + g), cw, ch));
      return { panels: out, band };
    }
    case 'fullbleed':
      return { panels: [rect(0, 0, W, H)], band };
    case 'tilted': {
      // One photo bleeds full-bleed behind three tilted snapshot prints.
      const bw = W * 0.30, bh = H * 0.58;
      return {
        panels: [
          rect(0, 0, W, H, 0, 'bleed'),
          rect(W * 0.06, H * 0.10, bw, bh, -4, 'snapshot'),
          rect(W * 0.36, H * 0.06, bw, bh, 2.5, 'snapshot'),
          rect(W * 0.66, H * 0.12, bw, bh, -2, 'snapshot'),
        ],
        band,
      };
    }
    case 'duotone': {
      const cw = (W - g * 3) / 2;
      return { panels: [rect(g, g, cw, H - g * 2), rect(g * 2 + cw, g, cw, H - g * 2)], band };
    }
    case 'comic': {
      const hs = [0.34, 0.24, 0.22, 0.20];
      let y = g;
      const out = hs.map((f) => {
        const h = Math.round((H - g * 5) * f);
        const r = rect(g, y, W - g * 2, h);
        y += h + g;
        return r;
      });
      return { panels: out, band };
    }
    case 'storystrip': {
      const cw = (W - g * 5) / 4;
      const out = [];
      for (let c = 0; c < 4; c++) out.push(rect(g + c * (cw + g), g, cw, H - g * 2));
      return { panels: out, band };
    }
    case 'hero3':
    default: {
      const heroW = Math.round(W * 0.60);
      const sideW = W - heroW - g * 2;
      const sh = (H - g * 4) / 3;
      return {
        panels: [
          rect(g, g, heroW - g, H - g * 2),
          rect(heroW + g, g, sideW, sh),
          rect(heroW + g, g * 2 + sh, sideW, sh),
          rect(heroW + g, g * 3 + sh * 2, sideW, sh),
        ],
        band,
      };
    }
  }
}
