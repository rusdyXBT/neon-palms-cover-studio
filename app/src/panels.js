// Panel layouts for NEON PALMS. Every layout returns panel rects in cover
// pixels plus a title-band rect and a tilt (degrees) per panel, so the render
// engine and the editor hit-test share one source of truth.

export const LAYOUTS = [
  { id: 'hero3', name: 'Hero + 3', panels: 4 },
  { id: 'grid4', name: '4-Panel Grid', panels: 4 },
  { id: 'grid9', name: '9-Panel Grid', panels: 9 },
  { id: 'fullbleed', name: 'Full-Bleed Hero', panels: 1 },
  { id: 'tilted', name: 'Tilted Snapshots', panels: 3 },
  { id: 'duotone', name: 'Duotone Split', panels: 2 },
  { id: 'comic', name: 'Comic Bands', panels: 4 },
  { id: 'storystrip', name: 'Story Strip', panels: 4 },
];

export function layoutById(id) {
  return LAYOUTS.find((l) => l.id === id) || LAYOUTS[0];
}

/**
 * Panel rects for a cover of W x H. Each rect: {x, y, w, h, tilt, frame}
 * (frame 'snapshot' draws a white polaroid border, 'plain' a keyline).
 * The title band sits across the bottom and overlaps the panels, poster-style.
 */
export function layoutPanels(layoutId, W, H) {
  const g = Math.max(6, Math.round(W * 0.006)); // keyline gap
  const titleH = Math.round(H * 0.235);
  const band = { x: 0, y: H - titleH, w: W, h: titleH };
  const P = (x, y, w, h, tilt = 0, frame = 'plain') => ({ x, y, w, h, tilt, frame });
  switch (layoutId) {
    case 'grid4': {
      const cw = (W - g * 3) / 2, ch = (H - g * 3) / 2;
      return { panels: [P(g, g, cw, ch), P(g * 2 + cw, g, cw, ch), P(g, g * 2 + ch, cw, ch), P(g * 2 + cw, g * 2 + ch, cw, ch)], band };
    }
    case 'grid9': {
      const cw = (W - g * 4) / 3, ch = (H - g * 4) / 3;
      const out = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++)
        out.push(P(g + c * (cw + g), g + r * (ch + g), cw, ch));
      return { panels: out, band };
    }
    case 'fullbleed':
      return { panels: [P(0, 0, W, H)], band };
    case 'tilted': {
      // One photo bleeds full-bleed behind three tilted snapshot prints.
      const bw = W * 0.30, bh = H * 0.58;
      return {
        panels: [
          P(0, 0, W, H, 0, 'bleed'),
          P(W * 0.06, H * 0.10, bw, bh, -4, 'snapshot'),
          P(W * 0.36, H * 0.06, bw, bh, 2.5, 'snapshot'),
          P(W * 0.66, H * 0.12, bw, bh, -2, 'snapshot'),
        ],
        band,
      };
    }
    case 'duotone': {
      const cw = (W - g * 3) / 2;
      return { panels: [P(g, g, cw, H - g * 2), P(g * 2 + cw, g, cw, H - g * 2)], band };
    }
    case 'comic': {
      const hs = [0.34, 0.24, 0.22, 0.20];
      let y = g;
      const out = hs.map((f) => {
        const h = Math.round((H - g * 5) * f);
        const r = P(g, y, W - g * 2, h);
        y += h + g;
        return r;
      });
      return { panels: out, band };
    }
    case 'storystrip': {
      const cw = (W - g * 5) / 4;
      const out = [];
      for (let c = 0; c < 4; c++) out.push(P(g + c * (cw + g), g, cw, H - g * 2));
      return { panels: out, band };
    }
    case 'hero3':
    default: {
      const heroW = Math.round(W * 0.60);
      const sideW = W - heroW - g * 2;
      const sh = (H - g * 4) / 3;
      return {
        panels: [
          P(g, g, heroW - g, H - g * 2),
          P(heroW + g, g, sideW, sh),
          P(heroW + g, g * 2 + sh, sideW, sh),
          P(heroW + g, g * 3 + sh * 2, sideW, sh),
        ],
        band,
      };
    }
  }
}
