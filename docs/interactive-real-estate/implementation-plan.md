# Implementation Plan

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Repository audit + architecture docs | Done (2026-07-23) |
| 1 | Data foundation (Prisma, spatial fields, seed) | Done (2026-07-23) |
| 2 | Masterplan MVP (raster + sync overlay) | Done (DB hydrate + unit proof; browser QA pending) |
| 3 | District plan | Done (interactive plan + building list sync; browser QA pending) |
| 4 | Floor flow without 3D | Done (SVG floor plan + apartment pages; browser QA pending) |
| 5 | Admin mapping editors | Done (visual editors + server actions; auth TBD) |
| 6 | 3D building viewer | Done (R3F lazy island + procedural floors; browser QA pending) |
| 7 | Filters, leads, reservations | Pending |
| 8 | Quality (a11y, perf, tests, prod) | Partial (MVP gates) |

## Phase 0 — Audit outcomes

1. Local repo was empty → scaffolded Next.js 16 App Router app.
2. Neon DB already contained domain tables (Project…Apartment, Lead, Reservation, Asset, User).
3. Schema gap: no normalized marker/polygon fields, no `MasterplanAsset` raster contract.
4. Docs created under `/docs/interactive-real-estate/`.

## Phase 1 — Data foundation

- [x] Define Prisma schema aligned with Neon + spatial extensions
- [x] Apply migration / `db push` for spatial columns
- [x] Seed masterplan asset + district markers/polygons
- [x] Typed repository helpers for project masterplan payload (placeholder-backed MVP)

## Phase 2 — Masterplan MVP (acceptance)

Must prove:

- [x] Placeholder aerial render fills immersive viewport
- [x] Markers use normalized coords
- [x] Image + SVG overlay share transform
- [x] Hover / click / keyboard / mobile sheet behaviors (implemented; headed browser QA pending)
- [x] Overlay alignment math verified for widths 360→1920 (unit tests)
- [x] Fallback district list
- [x] Broken-image fallback
- [x] No Three.js on masterplan route
- [x] lint + typecheck + tests + production build
- [ ] Headed browser sign-off for hover/zoom/pan/touch alignment

## Phase 3 — District plan

Closer aerial, building polygons/markers, synchronized building list, building routes.

## Phase 4 — Floor flow (no 3D)

Building page with floor list → floor SVG plan → apartment page. Full URL chain works without WebGL.

## Phase 5 — Admin visual mapping

Masterplan / district / floor SVG / GLB mesh mapping editors. No hand-typed pixels.

## Phase 6 — 3D building

GLB loader, per-floor material isolation, floor list sync, constrained orbit, WebGL fallback, reduced motion.

## Phase 7 — Filters & CRM

URL-driven apartment filters, lead form, reservation with conflict protection.

## Phase 8 — Quality

Responsive matrix, a11y audit, perf budgets, E2E, production hardening.

## Sequencing rule

Do not claim a phase complete without runnable proof (tests/build and, for interaction, browser verification of hover/zoom/pan/touch/alignment).
