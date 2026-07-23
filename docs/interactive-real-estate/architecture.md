# Interactive Real-Estate Platform — Architecture

## Audit summary (2026-07-23)

| Area | Finding |
|------|---------|
| Repository | Greenfield local checkout (`D:\Defanse`). No prior application source; only empty workspace. |
| Scaffold | Next.js **16.2.11** (App Router, `src/`), React **19**, TypeScript, Tailwind CSS **4**, ESLint. |
| Database | Existing Neon Postgres project `defanse` (`round-morning-35794797`) with Prisma-shaped tables already present. |
| Seed data | 1 published project (`defense-residence`), 2 districts (`district-a`, `district-b`). |
| Auth | `User` + `AdminRole` tables exist; no NextAuth/Clerk wiring in app code yet. |
| Storage | `Asset` table for uploads/validation; no CDN/object-storage integration yet. |
| 3D | Not installed. Must remain building-page-only (lazy chunk). |
| Gap vs product brief | Existing schema is SVG-element-id oriented. Product requires **raster aerial render + synchronized SVG overlay + normalized coordinates**. |

## Product goal

Premium interactive sales tool with hierarchical spatial navigation:

```
General Masterplan
  → District / Complex
    → Building
      → Interactive 3D Building (building page only)
        → Floor
          → Interactive Floor Plan (SVG)
            → Apartment details
```

Reference site (`defansehousing.com`) is used **only** for user-flow / aerial interaction patterns. Brand, copy, assets, and source are not copied.

## Stack decisions

| Layer | Choice | Rationale |
|-------|--------|-----------|
| Framework | Next.js App Router (RSC) | URL = source of truth; SEO; server data loading |
| Language | TypeScript strict | Contract safety for spatial + domain types |
| DB | Neon Postgres + Prisma | Already provisioned; typed migrations |
| Styling | Tailwind 4 + CSS variables | Premium architectural palette without map-game aesthetics |
| Masterplan L1 | Raster + SVG overlay + HTML tooltip | Photoreal presentation without WebGL cost |
| Building 3D | Three.js + R3F + Drei (Phase 6) | Isolated client island, dynamic import |
| Validation | Zod | Shared API / form / mapping contracts |
| State | URL + server data | No primary navigation in Zustand |

## Route map (shareable URLs)

| Level | Route |
|-------|-------|
| Project masterplan | `/projects/[projectSlug]` |
| District | `/projects/[projectSlug]/districts/[districtSlug]` |
| Building | `/projects/[projectSlug]/districts/[districtSlug]/buildings/[buildingSlug]` |
| Floor | `/projects/[projectSlug]/districts/[districtSlug]/buildings/[buildingSlug]/floors/[floorNumber]` |
| Apartment | `/apartments/[apartmentSlug]` |
| Search | `/search?...` (query params = filter source of truth) |
| Admin editors | `/admin/...` (Phase 5) |

Refresh, back/forward, and direct open must restore state from URL + DB.

## Component architecture

### Level 1 — Masterplan

```
InteractiveMasterplan
├── MasterplanViewport      // pan/zoom container, gesture handling
├── MasterplanImage         // responsive raster (AVIF/WebP/JPEG)
├── MasterplanSvgOverlay    // same transform as image
│   └── MasterplanHotspot   // marker and/or polygon
├── MasterplanTooltip       // desktop hover card
├── MasterplanControls      // zoom +/- / reset
├── MasterplanLegend
└── MasterplanMobileSheet   // first tap = select + sheet
```

**Hard rule:** image + overlay share one transform matrix (refs / motion values — not per-frame React state).

### Level 2 — District plan

`InteractiveDistrictPlan` mirrors masterplan architecture with building markers/polygons + accessible building list sync.

### Level 3 — Building 3D (Phase 6)

Server page shell + isolated `Building3DViewer` client island. Three.js never loads on masterplan/district routes.

### Level 4 — Floor plan

`InteractiveFloorPlan` — SVG paths keyed by `Apartment.svgElementId`.

## Spatial mapping model

Normalized coordinates only (`0–1` or `0–100%`). Pixel CSS positions are forbidden.

See:

- [`coordinate-system.md`](./coordinate-system.md)
- [`masterplan-contract.md`](./masterplan-contract.md)

## Data ownership

| Concern | Source of truth |
|---------|-----------------|
| Navigation depth | URL path |
| Filters | URL search params |
| Entity content | Postgres via Prisma |
| Hotspot geometry | `MasterplanAsset` + district/building spatial fields |
| Floor↔mesh | `Floor.meshName` ↔ GLB node name |
| Apt↔SVG | `Apartment.svgElementId` ↔ SVG `#id` |

## Performance boundaries

| Module | Load when |
|--------|-----------|
| Masterplan interaction | Project / district pages |
| Floor plan interaction | Floor page |
| Building 3D (Three/R3F) | Building page only (dynamic `ssr: false`) |
| Admin mapping editors | Admin routes only |

Pan/zoom must not set React state every frame.

## Accessibility

- Every hotspot has a keyboard-focusable control + `aria-label`
- Parallel text list for districts/buildings/apartments
- Status never color-only
- `prefers-reduced-motion` dampens zoom transitions
- Mobile: first tap selects (sheet), second action navigates
- Drag threshold prevents accidental click after pan

## Security / ops notes

- `DATABASE_URL` lives in `.env.local` (never commit)
- Admin auth TBD (existing `User.passwordHash` + role enum)
- Asset validation pipeline exists in schema (`Asset.validationStatus`)

## Current phase focus

Phase 0–2 MVP: documentation, schema with spatial fields, functional masterplan with placeholder aerial render, overlay sync proof across 360–1920px widths.
