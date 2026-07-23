# Interactive Mapping — Data Model

## Entities (domain)

Unchanged core hierarchy:

- `Project`
- `District` (area)
- `Building` / house-capable via naming + type flags later
- `Floor`
- `Apartment` (unit)

Business fields (price, rooms, status) stay on domain entities — **source of truth**. Mapping tables store geometry + destination + display overrides only.

## InteractiveAsset

Raster (or SVG) image owned by any hierarchy node.

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| ownerType | enum | PROJECT, DISTRICT, BUILDING, FLOOR, APARTMENT |
| ownerId | string | polymorphic owner |
| imageUrl | string | primary |
| mobileImageUrl | string? | optional crop |
| originalWidth | int | intrinsic px |
| originalHeight | int | intrinsic px |
| mimeType | string | |
| variant | DESKTOP \| MOBILE | |
| status | DRAFT \| PUBLISHED \| ARCHIVED | asset-level |
| createdAt / updatedAt | datetime | |

## InteractiveRegion

Drawn clickable shape on an asset.

| Field | Type | Notes |
|-------|------|--------|
| id | cuid | |
| assetId | fk | |
| regionType | enum | DISTRICT, BUILDING, FLOOR, APARTMENT, CUSTOM |
| title | string | |
| label | string? | marker / public label |
| shapeType | POLYGON \| RECTANGLE | |
| points | Json | versioned normalized geometry |
| destinationType | enum | see below |
| destinationEntityId | string? | |
| customUrl | string? | |
| openInNewTab | bool | |
| status | DRAFT \| PUBLISHED | region publish state |
| sortOrder | int | |
| styleConfig | Json? | colors |
| tooltipConfig | Json? | overrides |
| isPublished | bool | denormalized convenience |
| createdAt / updatedAt | | |

### DestinationType

`PROJECT | DISTRICT | BUILDING | HOUSE | FLOOR | APARTMENT | INTERNAL_ROUTE | EXTERNAL_URL | INFORMATION_ONLY | DISABLED`

### points JSON contract

```json
{
  "version": 1,
  "coordinateSystem": "NORMALIZED",
  "closed": true,
  "points": [
    { "x": 0.12, "y": 0.18 },
    { "x": 0.31, "y": 0.16 },
    { "x": 0.34, "y": 0.42 }
  ]
}
```

`x`,`y` ∈ [0, 1] relative to image content box / intrinsic aspect.

## InteractiveMarker

Optional label anchor for a region.

| Field | Notes |
|-------|--------|
| regionId | fk |
| x, y | normalized 0–1 |
| label | |
| styleConfig | Json? |
| isVisible | bool |

## Publish rule

Public frontend reads **only** regions/assets with `status = PUBLISHED` (and `isPublished = true`).

Draft edits never affect live site until explicit publish.
