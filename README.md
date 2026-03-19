# trophy-maps-assets

Static icon assets for Trophy Maps embeds. Served via jsDelivr.

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

## Usage

Reference icons via jsDelivr, pinned to a version tag:

```
https://cdn.jsdelivr.net/gh/OrLevCo/trophy-maps-assets@v1/icons/path-orange.svg
```

To add or update icons: commit the new file, push a new tag (e.g. `v2`), then update the URL in `transit-lines.js` in the main repo.
