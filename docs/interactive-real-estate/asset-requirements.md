# Asset Requirements

## Masterplan aerial render

| Requirement | Spec |
|-------------|------|
| Look | Photoreal or high-quality architectural bird’s-eye (not map tiles, not schematic-only) |
| Content | Buildings, roads, courtyards, greenery, parking, infrastructure |
| Presentation | Immersive — dominates first viewport |
| Interaction base | Raster + SVG overlay (Level 1 has no WebGL) |

## Responsive delivery

Do **not** ship a 40–100MB original to first paint.

| Tier | Format | Notes |
|------|--------|-------|
| Hero LQIP | tiny WebP/AVIF or blur hash | Immediate placeholder |
| Mobile | cropped/optimized render | Separate asset if crop differs |
| Tablet | mid srcSet | |
| Desktop | large optimized | |
| Fallbacks | AVIF → WebP → JPEG | `<picture>` / `next/image` |
| Cache | CDN + long cache headers + immutable hashed URLs | |

`srcSet` sizes should match layout breakpoints used by the viewport.

## Intrinsic metadata (required in DB)

For each masterplan (and district) raster:

- `imageUrl`, optional `mobileImageUrl`
- `width`, `height` (intrinsic)
- `viewBox` matching aspect
- `initialZoom`, `minZoom`, `maxZoom`

## District closer renders

Same strategy as project masterplan, scoped to one district’s buildings/yards/roads/entries/parking/amenities.

## Floor plans

Prefer **SVG** with one path/polygon per apartment (`id` ↔ `Apartment.svgElementId`). JPG/PNG with transparent hit divs is not acceptable as the sole approach.

## Building 3D

| Item | Spec |
|------|------|
| Format | GLB / glTF 2.0 |
| Structure | Named floor meshes/groups (`Floor_05`, …) |
| Mapping | `Floor.meshName` exact match |
| Delivery | Lazy-loaded only on building route |
| Fallback | Still image + floor list if WebGL unavailable |

## Admin uploads

Editors must:

1. Upload image
2. Preview
3. Place markers / draw polygons
4. Bind entities
5. Persist normalized coordinates
6. Preview desktop + mobile

Developers must not hand-author pixel CSS positions.

## Tiling

Image tiling (deep-zoom) is optional and only when a single optimized pyramid cannot preserve zoom detail. Prefer multi-resolution srcSet first.

## Placeholder (MVP)

Until final marketing renders exist, the repo ships a stylized architectural aerial SVG/PNG placeholder with known intrinsic size for coordinate proof. Replace via admin/`MasterplanAsset` without code changes to hotspot math.
