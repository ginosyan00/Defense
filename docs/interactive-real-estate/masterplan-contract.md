# Masterplan Contract

## Purpose

Level-1 project view: high-resolution **architectural aerial raster** + synchronized **SVG interaction overlay** + **HTML tooltip/sheet** layer. No realtime 3D.

## Payload shape (server → client)

```ts
type MasterplanPayload = {
  project: {
    id: string;
    slug: string;
    name: string;
  };
  asset: MasterplanAssetContract;
  hotspots: MasterplanHotspotContract[];
};

type MasterplanAssetContract = {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  width: number;   // intrinsic pixel width of source art
  height: number;  // intrinsic pixel height of source art
  viewBox: string; // e.g. "0 0 2400 1600" — SVG overlay space
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
  objectFit: "contain"; // default; mapping uses rendered content box
};

type MasterplanHotspotContract = {
  id: string;
  entityType: "district";
  entityId: string;
  slug: string;
  label: string;
  title: string;
  interactionType: "MARKER" | "POLYGON" | "MARKER_AND_POLYGON";
  markerX: number; // 0–1 normalized
  markerY: number; // 0–1 normalized
  svgPath?: string | null; // path `d` in asset viewBox space
  status: "AVAILABLE" | "COMING_SOON" | "SOLD_OUT" | "DISABLED" | "HIDDEN";
  buildingCount: number;
  availableApartmentCount: number;
  minPrice: number | null;
  currency: string;
  completionDate: string | null; // ISO
  href: string; // shareable district URL
  sortOrder: number;
};
```

## Interaction types

### TYPE A — Marker

Circular label control at `(markerX, markerY)`. Required fields: `label`, `title`, status, available count.

### TYPE B — Polygon

SVG path in the same viewBox as the raster. May be invisible at rest; on hover: translucent fill, outline, soft glow; optional surround dim.

Marker and polygon for the same entity share hover/selected state.

## Visual states

| State | Behavior |
|-------|----------|
| DEFAULT | Interactive if AVAILABLE |
| HOVERED | Marker scale + polygon highlight |
| FOCUSED | Visible focus ring (keyboard) |
| SELECTED | Persistent ring; mobile sheet open |
| DISABLED | Not activatable |
| COMING_SOON | Muted; info sheet; navigate only if published |
| SOLD_OUT | Status label; reservation CTA disabled; page may remain informational |

Status is never color-only (text / pattern / icon required).

## Transform sync contract

1. Measure **content box** of the rendered image (`object-fit: contain` aware).
2. Place overlay absolutely over that content box (not the full container letterbox).
3. Apply **identical** `translate(x,y) scale(z)` to a shared transform root wrapping image + overlay.
4. Pan/zoom updates go through refs / motion values — not React state every frame.

## Desktop vs mobile

| | Desktop | Mobile |
|--|---------|--------|
| Discover | Hover tooltip | First tap → select + bottom sheet |
| Navigate | Click / tooltip CTA | Explicit sheet CTA (second action) |
| Touch target | — | ≥ 44×44px |
| Accidental click | Drag threshold | Same |

## Tooltip / sheet content

- District / complex name
- Building count
- Available apartments
- Minimum price
- Completion date
- Status (text)
- “Դիտել” / View action

## Fallbacks

- Loading skeleton / LQIP
- Broken-image state with retry + list still usable
- Empty hotspots state
- Accessible district list always present (keyboard / SR / overlay failure)

## Non-goals (this contract)

- Google/OSM tiles
- Technical-only SVG diagram as the primary visual
- Three.js / WebGL on this route
- Fixed pixel hotspot CSS (`left: 823px`)
