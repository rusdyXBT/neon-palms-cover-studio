# NEON PALMS — Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rusdyXBT/neon-palms-cover-studio/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rusdyXBT/neon-palms-cover-studio/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline browser app that turns a photo + caption into GTA 6-style
multi-panel poster cover art — and exports it as PNG in all three post
sizes with one click. Built for the
[make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/c/gta6-cover-art-01).

## What it does

- **8 layouts** — Hero + 3, 4-panel grid, 9-panel grid, full-bleed hero,
  tilted snapshot collage, duotone split, comic bands, story strip.
- **6 gradient-map grades** — Vice Sunset, Neon Nights, Golden Hour,
  Palm Noir, Heat Haze, Dusk Purple — plus a per-panel grade override.
- **Any photo** — click a panel to pick a sample or upload your own, then
  drag to position, zoom, rotate, flip. One-photo-fills-all toggle included.
- **Poster lettering** — Anton display type with sunset-gradient fill and
  black outline, Pacifico neon-script subtitle, halftone title block, badge
  starburst, heat meter, tagline bar. Title, subtitle, badge and tagline
  are all editable inline.
- **Fast** — "Export all sizes" writes 1080×1080, 1080×1350 and 1920×1080
  PNGs in one click. Live preview, undo/redo, "Surprise me" randomize,
  grain + vignette toggles, vector palm / sun / flamingo stickers.
- **Offline** — vanilla ES modules, 2D canvas, zero dependencies, zero
  network requests. Fonts (Anton + Pacifico, OFL) and sample photos are
  vendored under `app/`.

## Try it

```sh
node serve.ts
# open http://localhost:8080
```

## Layout

- `app/index.html`, `app/style.css` — editor shell + dark neon UI.
- `app/src/cover.js` — render engine (panels, title band, grain, vignette).
- `app/src/panels.js` — the 8 layouts.
- `app/src/grades.js` — the 6 gradient-map grades.
- `app/src/editor.js` — UI wiring, per-panel editing, undo/redo, randomize.
- `app/src/export.js` — PNG export in all three sizes.
- `app/src/stickers.js` — own vector palm / sun / flamingo stickers.
- `app/src/shots.js`, `app/src/main.js` — screenshot scenes + boot.
- `main.ts` — the entry program: copies `app/` + `screenshots/` to
  `/output` and writes `dossier.json`.

Screenshots: `?shot=cover&layout=hero3&size=landscape` renders a cover
full-frame; `?shot=editor` shows the editor. See `shots.json`.

## License

MIT. Sample photos are original images generated for this entry; no
Rockstar logo, wordmark, artwork, character or font is used anywhere.
