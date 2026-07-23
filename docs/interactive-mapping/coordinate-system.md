# Interactive Mapping — Coordinate System

## Rule

Never persist screen-pixel positions.

Wrong: `{ "x": 850, "y": 430 }`  
Right: normalized `{ "x": 0.1245, "y": 0.3211 }`

## Spaces

| Space | Meaning |
|-------|---------|
| Screen | browser clientX/Y |
| Viewport local | relative to editor viewport element |
| Content box | object-fit:contain painted image rect |
| Normalized | 0–1 within content box / intrinsic aspect |
| ViewBox | SVG overlay matching image aspect |

## Conversion pipeline (editor)

```
pointer (client)
  → viewport-local
  → subtract content-box offset
  → divide by content-box size
  → apply inverse pan/zoom of editor viewport
  → clamp / validate normalized point
```

Inverse for rendering:

```
normalized
  → content-local %
  → place inside content box under shared transform root
```

Image layer and SVG overlay **must share one transform matrix**.

## Zoom / pan

Editor viewport transform is **ephemeral UI state**. It must never be written into `InteractiveRegion.points`.

## Resize proof

Normalized reconstruction must stay stable across widths:

`360, 390, 430, 768, 820, 1024, 1280, 1440, 1920`

Tolerance: &lt; 1px drift in content-space reconstruction tests.

## Shared utilities

| Module | Role |
|--------|------|
| `src/lib/coordinates.ts` | contain bounds, normalized helpers |
| `src/lib/mapping/geometry.ts` | polygon validation, close, rect→points |
| `src/lib/mapping/transform.ts` | screen↔normalized with pan/zoom |
| `src/lib/admin/mapping-math.ts` | legacy helpers (kept for old editors) |
