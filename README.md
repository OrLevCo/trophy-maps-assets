# trophy-maps-assets

Static SVG assets for Trophy Maps embeds and other Trophy consumers. Served via jsDelivr CDN.

## What lives here

| Folder | Contents |
|--------|----------|
| `icons/` | Transit line logos (PATH, Metro-North, LIRR, Amtrak) + generic train/bus icons. Pinned via tag in `transit-lines.js` |
| `building-logos/{slug}/` | Per-building wordmark lockup files - `wordmark.svg` (rectangular, transparent) + `wordmark-square.svg` (square 400×400, paper-bg). Used as Trophy Maps `building_tooltip_logo_url` and `building_logo_url` respectively |
| `scripts/` | Helper scripts (currently: the wordmark generator) |

## Icons

| File | Description |
|------|-------------|
| `icons/path-orange.svg` | PATH train logo (orange) |
| `icons/path-blue.svg` | PATH train logo (blue) |
| `icons/metro-north.svg` | MTA Metro-North logo |
| `icons/lirr.svg` | MTA LIRR logo |
| `icons/amtrak.svg` | Amtrak logo |
| `icons/train.svg` | Generic train icon (custom tags) |
| `icons/bus.svg` | Generic bus icon (custom tags) |

## Building logos

Each building has its own folder under `building-logos/{slug}/` with two files:

- `wordmark.svg` - rectangular lockup, transparent background, used for the tooltip on hover
- `wordmark-square.svg` - square 400×400 lockup with paper-color background fill, used for the 48×48 pin marker

Slug convention: lowercase, no separators (e.g. `39w37`, `119w57`).

**Spec, brand tokens, composition patterns, and the per-building flow live in the workspace canon:** `trophy-workspace/knowledge/project-delivery/assets/building-wordmarks.md`.

### Generating a wordmark pair

The generator outlines the building's wordmark from fonts (no live text) and writes both SVGs.

```bash
cd scripts
npm install         # first time only
node generate-wordmark.mjs configs/{slug}.json
```

Configs live in `scripts/configs/`. The config sets the building's slug, the three text groups (`left`, `sep`, `right`), brand tokens (`ink`, `accent`, `paper`), and font families.

Each new building needs its own `configs/{slug}.json`. Use an existing config (e.g. `39w37.json`) as a template.

## Usage from consumers

Reference assets via jsDelivr.

```
# Iteration (cache-busts on each push to main; do not use in production)
https://cdn.jsdelivr.net/gh/OrLevCo/trophy-maps-assets@main/building-logos/{slug}/wordmark.svg

# Production - pin to a commit hash or tag (jsDelivr caches forever)
https://cdn.jsdelivr.net/gh/OrLevCo/trophy-maps-assets@<sha-or-tag>/building-logos/{slug}/wordmark.svg
```

### Tag a new icons release

The `icons/` folder is consumed by `transit-lines.js` in the main `trophy-maps` repo via a pinned tag (currently `v1`). To add or update an icon:

1. Commit the new SVG
2. Push a new tag (e.g. `v2`)
3. Update the URL in `transit-lines.js`

### Pin a building logo to production

When a building goes live, repin its Trophy Maps Brand-tab URLs from `@main` to a specific commit hash so future edits to this repo don't silently change the launched site's marker. Precedent: 119 W 57 pins its square to commit `cb352a0`.
