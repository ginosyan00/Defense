# Coordinate System

## Rule

**Never store hotspot positions as fixed CSS pixels.**

Wrong:

```css
left: 823px;
top: 412px;
```

Correct (normalized):

```json
{ "markerX": 0.3752, "markerY": 0.6184 }
```

or percent form in APIs/UI:

```json
{ "xPercent": 37.52, "yPercent": 61.84 }
```

Database stores normalized decimals `0–1` (`markerX`, `markerY`).

## Spaces

| Space | Units | Role |
|-------|-------|------|
| Intrinsic image | pixels (`asset.width` × `asset.height`) | Source art resolution |
| ViewBox | same aspect as intrinsic | SVG polygon/path coordinates |
| Normalized | `0–1` | DB / API marker positions |
| Content box | CSS px | Actual painted image inside container after `object-fit` |
| Screen | CSS px | Pointer events |

## Object-fit: contain mapping

Container size ≠ visible image size when aspects differ.

```
contentWidth  = min(containerW, containerH * (imageW / imageH))
contentHeight = contentWidth * (imageH / imageW)
offsetX = (containerW - contentWidth) / 2
offsetY = (containerH - contentHeight) / 2
```

Normalized → content-local:

```
localX = markerX * contentWidth
localY = markerY * contentHeight
```

Screen (before pan/zoom):

```
screenX = offsetX + localX
screenY = offsetY + localY
```

Overlay root is positioned at `(offsetX, offsetY)` with size `(contentWidth, contentHeight)`, so markers use `%` of overlay:

```
left: markerX * 100%
top:  markerY * 100%
```

Polygons use the asset `viewBox` and stretch to the same overlay box (`preserveAspectRatio="none"` only when viewBox aspect matches intrinsic aspect — which it must).

## Pan / zoom

Shared transform on a single wrapper:

```
transform: translate(panX, panY) scale(zoom)
transform-origin: 0 0  /* or center — pick one and keep consistent */
```

Image layer and SVG overlay are **siblings under that wrapper**. They must never have independent transforms.

## Mobile vs desktop assets

If `mobileImageUrl` uses a different crop, store a **separate mapping set** for that asset (separate `MasterplanAsset` row or `SpatialMapping` variant). Do not reuse desktop normalized coords on a differently cropped mobile render.

## Validation

- `markerX`, `markerY` ∈ [0, 1]
- Polygon points ∈ viewBox bounds (soft warn if slightly outside)
- Intrinsic width/height > 0
- ViewBox aspect ≈ intrinsic aspect (tolerance ≤ 0.5%)

## Testing obligation

Overlay drift tests must evaluate content-box math at least at widths:

`360, 390, 430, 768, 820, 1024, 1280, 1440, 1920`

For a fixed container height strategy (e.g. `100dvh` or fixed aspect stage), assert marker projected positions stay within 1px of expected after rounding.
