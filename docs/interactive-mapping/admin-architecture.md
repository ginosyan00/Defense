# Interactive Mapping — Admin Architecture

## Audit summary (2026-07-23)

| Area | Current state |
|------|----------------|
| Stack | Next.js 16 App Router, Prisma, Neon Postgres, Tailwind 4 |
| Public flow | Project → District → Building → Floor → Apartment (shareable URLs) |
| Legacy admin | `/admin` with per-level editors (`MappingCanvas`, masterplan/district/floor/3d mappers) |
| Gap | No generic `InteractiveAsset` / `InteractiveRegion` model; no unified drawing engine; no draft/publish for mappings; no auth hardening |
| 3D policy (this initiative) | **No WebGL/GLB for admin floor picking** — use pre-rendered building image + drawn floor polygons |

## Goal

Production admin where operators manage the full interactive navigation tree **without editing source code**:

```
Project (masterplan image)
  → District polygons
    → Building polygons (closer aerial)
      → Floor polygons (on building render image — not GLB)
        → Apartment polygons (floor plan image)
```

## Core principle

```
Image + Admin drawing editor + SVG polygon overlay + Entity/URL mapping
```

One reusable engine for all levels:

- `InteractiveImageMappingEditor` (admin)
- `InteractiveImageViewer` (public — later phase)

Shared coordinate utilities must be identical on both sides.

## Component architecture (target)

```
InteractiveImageMappingEditor
├── ImageCanvas
├── SvgDrawingLayer
├── PolygonRenderer
├── PolygonEditor
├── DrawingToolbar
├── EntitySidebar
├── MappingForm
├── ZoomControls
├── HistoryControls
├── ValidationPanel
└── PreviewMode
```

## Admin hierarchy routes (planned)

```
/admin
/admin/projects
/admin/projects/[projectSlug]
/admin/projects/[projectSlug]/masterplan   ← asset + district regions
/admin/projects/[projectSlug]/districts/[districtSlug]/mapping
/admin/projects/[projectSlug]/.../buildings/[buildingSlug]/mapping  ← floor polygons on render image
/admin/projects/[projectSlug]/.../floors/[n]/mapping               ← apartment polygons
/admin/mapping-lab                           ← MVP sandbox (Phase 2)
```

## Roles (planned)

| Role | Capabilities |
|------|----------------|
| SUPER_ADMIN | Full |
| ADMIN | CRUD + publish |
| EDITOR | Draft edit; publish if permitted |
| VIEWER | Read + preview |

Current schema has `AdminRole = ADMIN | EDITOR | VIEWER`. Extend with `SUPER_ADMIN` in Phase 1.

## Non-goals for Phase 0–2 MVP

- Full CRUD for all entities
- Auth middleware
- Image CDN pipeline
- Public viewer rewrite
- E2E Playwright suite (tests start with unit/coordinate coverage)

## Migration strategy

- Keep existing entity tables (`Project`, `District`, `Building`, `Floor`, `Apartment`)
- Add generic spatial tables: `InteractiveAsset`, `InteractiveRegion`, `InteractiveMarker`
- Legacy field mappings (`markerX`, `svgPath` on District/Building) remain until public renderer migrates to published regions
