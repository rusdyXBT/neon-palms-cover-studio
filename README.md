# NEON PALMS — Cover Studio

[![make.fun](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/c/gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/rusdyXBT/neon-palms-cover-studio/rank.svg)](https://make.fun/c/gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/rusdyXBT/neon-palms-cover-studio/reward.svg)](https://make.fun/c/gta6-cover-art-01)

An offline browser app that turns a photo + caption into GTA 6-style
multi-panel poster cover art — and exports it as PNG in four post sizes
with one click. Built for the
[make.fun "Make GTA 6 Cover Art" bounty](https://make.fun/c/gta6-cover-art-01).

## The cover: Vice Dusk

The round-3 cover is **not** another orange sports car. The hero is a
woman in a pink blazer standing by a vintage car on a neon-lit Vice City
street at dusk, under the **Vice Dusk** palette — magenta dusk sky, teal
boulevard shadows, gold lettering. The poster carries seven devices at
once: gradient title, neon script subtitle, segmented heat meter (5/5),
diagonal ribbon ("VICE DUSK · 2026"), tagline bar ("EVERY STREET IS A
STAGE"), badge starburst with rays, and a halftone title block.

## What it does

- **10 layouts** — Boulevard (new, the default), Skyline (new), Hero + 3,
  4-panel grid, 9-panel grid, full-bleed hero, tilted snapshot collage,
  duotone split, comic bands, story strip.
- **8 gradient-map grades** — Vice Dusk (new, the default), Boulevard Pink
  (new), Vice Sunset, Neon Nights, Golden Hour, Palm Noir, Heat Haze, Dusk
  Purple — plus a per-panel grade override and snapshot captions.
- **Any photo** — click a panel to pick a sample or upload your own, then
  drag to position, zoom, rotate, flip, or nudge with the arrow keys
  (Shift = bigger step). One-photo-fills-all toggle included.
- **Poster lettering** — Anton display type with sunset-gradient fill,
  double stroke (ink + gold hairline), Pacifico neon-script subtitle,
  halftone title block, badge starburst with rays, diagonal ribbon,
  segmented heat meter, tagline bar. Title, subtitle, badge, tagline and
  ribbon are all editable inline.
- **Fast** — "Export all sizes" writes 1080×1080, 1080×1350, 1920×1080
  and 1080×1920 PNGs in one click. Live preview, undo/redo with counts,
  "Surprise me" randomize, preset save/load/reset, grain + vignette
  toggles, vector palm / sun / flamingo / star / wave stickers.
- **Offline** — vanilla ES modules, 2D canvas, zero dependencies, zero
  network requests. Fonts (Anton + Pacifico, OFL) and sample photos are
  vendored under `app/`.

## Try it

```sh
node serve.ts
# open http://localhost:8080
# health check: curl http://localhost:8080/__health
```

Keyboard: `Ctrl/⌘+Z` undo, `Ctrl/⌘+Shift+Z` or `Ctrl/⌘+Y` redo,
arrow keys nudge the selected panel, `[` / `]` cycle layouts,
`G` cycles grades.

## Layout

- `app/index.html`, `app/style.css` — editor shell + dark neon UI.
- `app/src/cover.js` — render engine (panels, title band, ribbon, heat
  meter, grain, vignette).
- `app/src/panels.js` — the 10 layouts.
- `app/src/grades.js` — the 8 gradient-map grades.
- `app/src/editor.js` — UI wiring, per-panel editing, undo/redo,
  randomize, presets.
- `app/src/export.js` — PNG export in four sizes.
- `app/src/stickers.js` — own vector palm / sun / flamingo / star / wave
  stickers.
- `app/src/shots.js`, `app/src/main.js` — screenshot scenes + boot.
- `main.ts` — the entry program: validates `entry.png` + `screenshots/`,
  copies `app/` + `screenshots/` + `entry.png` to `/output`, writes
  `cover-manifest.json` and `dossier.json`.
- `entry.png` — the hero entry image, in the repo root.

Screenshots: `?shot=cover&layout=boulevard&size=landscape` renders a
cover full-frame; `?shot=editor` shows the editor. Ribbon, badge,
tagline and heat are URL-addressable too
(`&ribbon=…&heat=5`). See `shots.json`.

## Round 3 notes

Round 2 was rejected: the fixer re-typed 15 files byte-identical, so the
kit counted 0.2% authored, and the entry shipped with no entry image.
Round 3 is a genuine rewrite — new composition (Boulevard layout),
new palette (Vice Dusk), new hero (person, not car), new devices
(ribbon, segmented heat meter, badge rays, stripe divider, snapshot
captions), new grades/layouts/sizes, and `main.ts` now refuses to hand
in an entry without `entry.png` in the repo root.

## License

MIT. Sample photos are original images generated for this entry; no
Rockstar logo, wordmark, artwork, character or font is used anywhere.
