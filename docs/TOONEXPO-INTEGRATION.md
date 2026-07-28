# Defense → ToonExpo Ecosystem Integration Plan

**Single deliverable doc.** Give **only this file** to the ToonExpo agent.  
**Goal:** Port **only the clean 4-phase interactive mapping Admin functionality** from [ginosyan00/Defense](https://github.com/ginosyan00/Defense.git) into ToonExpo Admin — same Admin UI / sidebar patterns, images on **Cloudflare R2**, mutations through **NestJS**, no prototype baggage.

---

## START HERE — paste into ToonExpo chat

```text
Կատարիր Defense → ToonExpo Interactive Mapping ամբողջական port-ը։

Պարտադիր կարդա և հետևիր այս ֆայլին ամբողջությամբ.
docs/TOONEXPO-INTEGRATION.md
(հատկապես § START HERE, §-1 ZERO-OMISSION, §2.1–§2.4, §11, §12, §17)

SOURCE (միայն սա).
https://github.com/ginosyan00/Defense.git
Եթե local clone չկա — clone արա (օր. D:\Neetrino\Defense), հետո SOURCE ֆայլերը կարդա այստեղից։
Չօգտագործես այլ folder որպես SOURCE, եթե git remote-ը այդ URL-ը չէ։

TARGET.
Այս repo-ն (ToonExpo_Ecosystem)։ Աշխատիր այստեղ։

Locked decisions (մի հարցրու նորից).
- District Option A
- Extend VisualHotspot (polygon + point coexist)
- Admin / platform_admin only
- ToonExpo Admin UI (ոչ Defense --mp-* )

Կանոններ.
- Ամեն PORT ֆայլից առաջ բացիր SOURCE ֆայլը
- §2.4 Yes տողերը բոլորը պետք է լինեն
- Images → R2 + MediaAsset միայն
- Mutations → NestJS միայն (ոչ Prisma apps/web-ում, ոչ Server Actions)
- SKIP. Building3dMapper, FloorSvgMapper, StoredMedia, mapping-lab որպես product
- Ավարտից առաջ PR description-ում նշիր §17 checklist-ը տող առ տող

Սկսիր Wave 1-ից և շարունակիր մինչև Definition of Done (§-1), եթե չեմ ասել կանգ առնել։
```

---

## -1. ZERO-OMISSION PROTOCOL (mandatory for any agent)

This is not a sketch. Incomplete port = failed task.

### Locked product decisions (do not re-ask; do not invent alternatives)

| # | Decision | Locked value |
|---|----------|--------------|
| 1 | District | **Option A** — add `District` model |
| 2 | Geometry storage | **Extend `VisualHotspot`** (+ polygon fields); keep point hotspots working |
| 3 | Audience v1 | **Admin / platform_admin only** |
| 4 | Point vs polygon | **Coexist** on the same canvas |

### Hard rules

1. Work only in TARGET: ToonExpo (`D:\Neetrino\ToonExpo` / `neetrino/ToonExpo_Ecosystem`).
2. Read SOURCE only from https://github.com/ginosyan00/Defense.git (clone if needed). Never invent mapping math.
3. Before changing/creating a TARGET file that ports a SOURCE file: **open and read the SOURCE file first**.
4. Finish every item marked **PORT** / **Yes** in §2.1–§2.4. Skipping requires an explicit line in the PR: `SKIPPED: <item> — reason`.
5. Every **REWRITE** item must land as Nest + R2 (no Server Actions, no `StoredMedia`, no `public/uploads`).
6. Every **SKIP** item must stay out of the product (3D, FloorSvgMapper, mapping-lab as permanent page).
7. UI must use ToonExpo Admin tokens/shell/`AdminNav` — not Defense `--mp-*`.
8. Do not claim “done” until §12 acceptance criteria + §2.4 Yes-rows are all checked in the PR description.
9. Prefer one coherent feature branch and sequential Waves 1→5; do not stop after “schema only” unless the user said so.
10. Named exports only; TypeScript strict; no `any`.

### Done definition (Definition of Done)

- [ ] Defense clone available and used as SOURCE
- [ ] §2.4 rows 1–18 = implemented (19 optional)
- [ ] Sidebar section live
- [ ] Images → R2 + `MediaAsset`
- [ ] Polygons save + load via Nest
- [ ] Band + auto-stack on floor phase
- [ ] Public catalog can render published polygons (Wave 5)
- [ ] Unit tests for coordinate/math ported and green
- [ ] No Prisma in `apps/web` for this feature

---

## 0. Repos (where code comes from / where it goes)

| Role | GitHub | Local path (this machine) |
|------|--------|---------------------------|
| **SOURCE — take mapping code from here** | https://github.com/ginosyan00/Defense.git | Clone as needed, e.g. `D:\Neetrino\Defense` (or current workspace if it is that clone) |
| **TARGET — integrate into here** | https://github.com/neetrino/ToonExpo_Ecosystem.git | `D:\Neetrino\ToonExpo` |

**Canonical SOURCE:** [ginosyan00/Defense](https://github.com/ginosyan00/Defense.git) (fork of Manvel-Lambaryan/Defense).  
All Admin mapping code paths below are relative to that repo root (`src/app/admin/**`, `src/components/admin/**`, `src/lib/admin/**`).

**How the agent must take code**

1. Open / work in **TARGET** repo: `ToonExpo_Ecosystem` (`D:\Neetrino\ToonExpo`).
2. Clone or fetch **SOURCE** if missing:
   ```bash
   git clone https://github.com/ginosyan00/Defense.git
   ```
3. **Read / copy algorithms & UI behavior** from SOURCE paths in §2.1–§2.3 (relative to Defense repo root). Prefer GitHub/`git show` / local clone of Defense — **not** an unrelated folder name unless it is the same git remote.
4. **Rewrite** storage and mutations for ToonExpo (R2 + Nest + contracts) — do **not** copy the whole Defense app into ToonExpo.
5. This file alone is enough — put it at `docs/TOONEXPO-INTEGRATION.md` in TARGET.

**Source of truth for Admin behavior:** Defense `src/app/admin/**` + `src/components/admin/**`.

---

## 1. Verdict

Defense-ը **չի պատճենվում** որպես Next.js monolith։ ToonExpo-ում արդեն կան.

| ToonExpo already has | Defense adds (must port) |
|----------------------|-------------------------|
| `Project → Building → Floor → Apartment` catalog | **Polygon** drawing (not only point markers) |
| `MediaAsset` + **R2** uploads | **4-phase guided setup** UX |
| `VisualMapCanvas` + `VisualHotspot` (point `%` only) | Zoom/pan SVG editor (`MappingCanvas`) + band/auto-stack |
| Admin sidebar + shadcn/tokens | Curved polygon / vertex edit / undo-redo |
| Builder + admin catalog scopes | Image→entity mapping workflow per phase |
| Admin/builder entity CRUD | Inline **Create** forms inside phase cards (optional reuse of existing sheets) |

**Do not port:** Postgres `StoredMedia` bytes, `/api/media/[id]`, local `public/uploads`, Next.js Server Actions as product API, Defense Tailwind tokens (`--mp-*`), 3D/GLB floor picker (`Building3dMapper`), legacy `FloorSvgMapper` (SVG element-id linking), consultation/lead prototype extras, mapping-lab sandbox as a permanent product surface.

---

## 2. Source: what the 4 phases are

Admin flow in Defense (`/admin` → project → phase cards):

| Phase | Title (hy) | Admin job | Image | Mapped entity |
|------:|------------|-----------|-------|---------------|
| 1 | Թաղամասեր | Create district(s) + place markers/polygons on **project masterplan** | Masterplan raster | `District` |
| 2 | Շենքեր | Create building(s) + place on **district plan** | District aerial/plan | `Building` |
| 3 | Հարկեր | Setup floor count + upload building render + draw floors (incl. band/auto-stack) | Building render | `Floor` |
| 4 | Բնակարաններ | Create apartments + upload floor plan + draw apartment polygons | Floor plan | `Apartment` |

Public journey mirrors the same hierarchy with SVG overlays (out of Admin; Wave 5).

### 2.1 Complete Admin route inventory (SOURCE)

Base (Defense repo): `src/app/admin/`  
GitHub: https://github.com/ginosyan00/Defense/tree/main/src/app/admin

| Route | File | Functional (must preserve in TARGET) | Action |
|-------|------|--------------------------------------|--------|
| `/admin` | `page.tsx` | Project list + create project + phase progress summary | **PORT behavior** |
| `/admin` layout | `layout.tsx` | Admin chrome only | **SKIP** — use ToonExpo Admin shell |
| `/admin/projects/[projectSlug]` | `projects/[projectSlug]/page.tsx` | **4 phase cards**, locked/active/done, create district/building/apartment, floor setup entry, deep links | **PORT behavior** |
| `/admin/projects/…/masterplan` | `…/masterplan/page.tsx` | Upload masterplan + map districts | **PORT** |
| `/admin/projects/…/districts/[districtSlug]` | `…/districts/[districtSlug]/page.tsx` | Upload district plan + map buildings | **PORT** |
| `/admin/projects/…/buildings/…/render` | `…/render/page.tsx` | Floor setup + upload render + map floors | **PORT** |
| `/admin/projects/…/floors/[floorNumber]` | `…/floors/[floorNumber]/page.tsx` | Floor plan upload picker + map apartments | **PORT** |
| `/admin/mapping-lab` | `mapping-lab/page.tsx` | Sandbox editor | **TEMP only** (QA), then remove |
| `/admin/…/buildings/…/3d` | `…/3d/page.tsx` | GLB mesh floor picker | **SKIP** |

### 2.2 Complete Admin component inventory (SOURCE)

Base (Defense repo): `src/components/admin/`  
GitHub: https://github.com/ginosyan00/Defense/tree/main/src/components/admin

| File | What it does | Action |
|------|--------------|--------|
| `MappingCanvas.tsx` | Core editor: select/marker/polygon, zoom/pan, undo draft, dirty save, **band** + **auto-stack** (floors) | **PORT** (restyle) |
| `PolygonEditHandles.tsx` | Vertex / curve / move / scale / rotate handles | **PORT** |
| `MappingToolbarIcons.tsx` | Toolbar icons (incl. band/stack) | **PORT** |
| `MasterplanMappingEditor.tsx` | Phase 1 editor wrapper | **PORT → rewrite API** |
| `DistrictBuildingEditor.tsx` | Phase 2 editor wrapper | **PORT → rewrite API** |
| `BuildingFloorMappingEditor.tsx` | Phase 3 editor wrapper | **PORT → rewrite API** |
| `FloorApartmentMappingEditor.tsx` | Phase 4 editor wrapper | **PORT → rewrite API** |
| `AdminPhaseCard.tsx` | Phase card UI (locked/active/done) | **PORT behavior** + ToonExpo UI |
| `CreateProjectForm.tsx` | `CreateProjectForm` + `CreateEntityForm` (district/building/apartment) | **PORT behavior** — prefer ToonExpo sheets/API if equivalent exists |
| `BuildingFloorSetupForm.tsx` | Floor count + trigger setup/upload | **PORT → Nest setup-floors** |
| `AdminBuildingFloorUploadPicker.tsx` | Pick which floor gets plan upload | **PORT** |
| `MasterplanImageUploader.tsx` | Masterplan image upload | **REWRITE → R2 admin media** |
| `DistrictPlanImageUploader.tsx` | District plan upload | **REWRITE → R2** |
| `BuildingRenderImageUploader.tsx` | Building render upload | **REWRITE → R2** |
| `FloorPlanImageUploader.tsx` | Floor plan upload | **REWRITE → R2** |
| `Building3dMapper.tsx` | 3D mesh mapping | **SKIP** |
| `FloorSvgMapper.tsx` | Legacy: map apartments to SVG `elementId` from uploaded SVG | **SKIP** (polygon path is the product path) |

### 2.3 Complete Admin lib inventory (SOURCE)

Base (Defense repo): `src/lib/`  
GitHub: https://github.com/ginosyan00/Defense/tree/main/src/lib

| File | What it does | Action |
|------|--------------|--------|
| `admin/mapping-math.ts` | Pointer↔normalized, path helpers, **band/stack** | **PORT** |
| `admin/curved-polygon.ts` | Quadratic edge bends ↔ svgPath | **PORT** |
| `admin/polygon-transform.ts` | Move/scale/rotate point sets | **PORT** |
| `admin/mapping-math.test.ts` | Unit tests | **PORT** |
| `coordinates.ts` (+ test) | Coordinate helpers | **PORT** |
| `mapping/geometry.ts`, `transform.ts`, `history.ts`, `routes.ts`, `types.ts`, `mapping.test.ts` | Shared mapping utils | **PORT** (trim unused) |
| `format-marker-label.ts` | Marker label normalize | **PORT** |
| `media/prepare-image-upload.ts` | Client resize/validate before upload | **PORT** (feed R2 upload) |
| `admin/mapping-actions.ts` | `saveDistrictMapping`, `saveBuildingMapping`, `saveFloorImageMapping`, `saveApartmentImageMapping`, (+ legacy svg/mesh) | **REWRITE → Nest** (skip mesh/svgElementId) |
| `admin/project-actions.ts` | `createProject`, `createDistrict`, `createBuilding`, `createFloor`, `createApartment`, deletes | **REWRITE → Nest** or reuse ToonExpo catalog APIs |
| `admin/setup-building-floors.ts` | Ensure N floors + attach render image | **REWRITE → Nest** |
| `admin/upload-masterplan.ts` | Persist masterplan | **REWRITE → R2 + canvas attach** |
| `admin/upload-district-plan.ts` | Persist district plan | **REWRITE → R2** |
| `admin/upload-building-render.ts` | Persist building render | **REWRITE → R2** |
| `admin/upload-floor-plan.ts` | Persist floor plan | **REWRITE → R2** |
| `media/store-media.ts`, `media/get-stored-media.ts` | Disk + Neon bytes | **SKIP** |
| `app/api/media/[id]/route.ts` | Serve stored bytes | **SKIP** |

### 2.4 Admin functional checklist (behavior — not files)

Everything below exists in Manvel Admin and **must** appear in the TARGET Admin Interactive Mapping section (unless marked skip).

| # | Behavior | Phase | Port? |
|---|----------|------:|:-----:|
| 1 | Create project from Admin home | 0 | Yes* |
| 2 | List projects with active-phase progress | 0 | Yes |
| 3 | Open project → 4 phase cards (only one active) | 1–4 | Yes |
| 4 | Create district inline on phase 1 card | 1 | Yes* |
| 5 | Upload masterplan image | 1 | Yes (R2) |
| 6 | Place district marker +/or polygon; save; auto-save on polygon close | 1 | Yes |
| 7 | Create building inline on phase 2 | 2 | Yes* |
| 8 | Upload district plan image | 2 | Yes (R2) |
| 9 | Place building marker +/or polygon on district plan | 2 | Yes |
| 10 | Floor count setup for a building | 3 | Yes |
| 11 | Upload building render image | 3 | Yes (R2) |
| 12 | Draw floor polygons on render (marker/polygon) | 3 | Yes |
| 13 | **Band** tool + **Auto-stack** floors from quad | 3 | Yes |
| 14 | Create apartment inline on phase 4 | 4 | Yes* |
| 15 | Per-floor plan upload (+ picker across floors) | 4 | Yes (R2) |
| 16 | Draw apartment polygons on floor plan | 4 | Yes |
| 17 | Vertex edit, curve bend, move/scale/rotate, undo draft point, zoom/pan | all | Yes |
| 18 | Dirty `*` / save feedback | all | Yes |
| 19 | Delete district / building (Manvel has it) | 1–2 | Optional — use ToonExpo catalog delete if exists |
| 20 | 3D GLB floor mapper | 3 | **No** |
| 21 | FloorSvgMapper (SVG id linking) | 4 | **No** |
| 22 | Mapping lab permanent product page | — | **No** (temp QA OK) |

\*If ToonExpo Admin/Builder already creates the same entities, **reuse those APIs/sheets** and only keep inline create when it speeds the mapping wizard.

### 2.5 Supporting docs in SOURCE (read, don’t invent)

| Doc | Path in Defense | GitHub |
|-----|-----------------|--------|
| Overview | `docs/PROJECT-OVERVIEW.md` | [link](https://github.com/ginosyan00/Defense/blob/main/docs/PROJECT-OVERVIEW.md) |
| Coordinates | `docs/interactive-mapping/coordinate-system.md` | [tree](https://github.com/ginosyan00/Defense/tree/main/docs/interactive-mapping) |
| Editor behavior | `docs/interactive-mapping/editor-behavior.md` | same tree |
| Data model notes | `docs/interactive-mapping/data-model.md` | same tree |

---


## 3. Target constraints (non-negotiable)

From ToonExpo `docs/TECH_CARD.md` + `FRONTEND_BACKEND_BOUNDARY`:

```text
Browser → apps/web (Next.js UI only) → apps/api (NestJS) → Prisma → Neon
Images → Cloudflare R2; metadata → MediaAsset
```

| Rule | Implication for this port |
|------|---------------------------|
| No Prisma in `apps/web` | Editors fetch/mutate via typed API client |
| No product Server Actions | All saves = Nest REST |
| R2 for media | Replace Manvel disk/Neon bytes with `MediaUploadService` + `R2StorageService` |
| Admin UI language | Reuse `AdminNav`, tokens, sheets, cards — not Manvel `--mp-*` theme |
| Auth | `platform_admin` for Admin section; optionally later expose to builder portal |

Existing visual map (`VisualHotspot`: `xPercent` / `yPercent` only) is **point markers**. Defense’s value is **closed polygon SVG paths**. Integration must **extend** the model (or add sibling tables) — not pretend points equal polygons.

---

## 4. Domain gap: District

| Manvel | ToonExpo today |
|--------|----------------|
| `Project → District → Building → Floor → Apartment` | `Project → Building → Floor → Apartment` |
| Phase 1 = districts on masterplan | No `District` model |

### Recommended decision (pick one before coding)

**Option A — Add `District` (faithful 4 phases)**  
- Prisma `District` under `Project`; `Building.districtId` optional or required.  
- Phase 1/2 match Manvel 1:1.  
- More migration work; clearest UX for multi-quarter masterplans.

**Option B — Collapse to 3 product phases (faster)**  
- Phase 1: masterplan → **buildings** (merge Manvel 1+2).  
- Phase 2: building render → floors.  
- Phase 3: floor plan → apartments.  
- Admin UI can still show “4 steps” if step 0 = create project/inventory entities.

**Option C — Soft district via VisualMap only**  
- No District table; phase-1 regions are hotspots/polygons targeting buildings grouped by label.  
- Weakest data model; avoid unless product explicitly rejects District.

**Default recommendation for clean port of “այս 4 փուլերը”:** **Option A**.

---

## 5. Data model plan (packages/db)

### 5.1 Reuse as-is

- `MediaAsset` (+ R2 `fileUrl`, `width`, `height`)
- `Project` / `Building` / `Floor` / `Apartment`
- Existing cover / floorplan media FKs where they already fit

### 5.2 Extend visual map for polygons

Minimal additive approach (prefer extending existing module 06):

```text
VisualMapCanvas          — already: context + mediaAssetId + publication
VisualHotspot            — today: point only
  + shapeType: point | polygon   (or new table VisualRegion)
  + svgPath String?              — viewBox / normalized path (document one coordinate system)
  + interactionType              — marker | polygon | both
  + points Json?                 — optional structured points (editor source of truth)
```

**Coordinate contract (port from Manvel docs):**

- Pointer → normalized `0…1` relative to `object-fit: contain` content box.
- Persist either percent (`xPercent`/`yPercent`) for markers **and/or** SVG `d` in agreed viewBox space.
- Document once in `docs/…` and share types in `@toonexpo/contracts`.
- Port unit tests that prove 360→1920 no-drift.

### 5.3 Optional canvas contexts

Today: `VisualMapContextType = project | building | floor`.

If Option A (District):

- Add `district` context type, **or** keep district masterplan as `project` canvas and district-plan as a dedicated canvas linked by convention.

### 5.4 Do not add

- `StoredMedia`
- Parallel `InteractiveAsset` / `InteractiveRegion` **unless** product wants a second mapping system — prefer one Visual Map module with polygon support.

---

## 6. Media: R2 only

Manvel today:

```text
File → public/uploads + optional Neon Bytes → /api/media/[id] or static URL
```

ToonExpo target:

```text
Admin UI → POST /api/v1/admin/media (multipart)
       → R2StorageService.put
       → MediaAsset row (fileUrl = R2 public URL, width/height)
       → VisualMapCanvas.mediaAssetId / entity plan FKs
```

| Manvel upload | ToonExpo equivalent |
|---------------|---------------------|
| Masterplan uploader | Admin media upload + attach as project/district canvas `mediaAssetId` |
| District plan | Same, context = district (or project sub-canvas) |
| Building render | Building cover **or** building-context visual canvas media |
| Floor plan | Existing `Floor.floorplanMediaId` + floor-context canvas |

**Env (already in ToonExpo `.env.example`):**  
`R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME`, `R2_PUBLIC_URL`.

Degraded mode: empty R2 → upload 503 (existing behavior) — mapping editor must show clear empty state.

---

## 7. Admin UI placement (sidebar + same UI)

### 7.1 Sidebar

File: `apps/web/src/features/admin/components/admin-nav.tsx`

Add a **dedicated primary item** (not buried only under Projects children), e.g.:

| Key | Suggested href | Icon idea |
|-----|----------------|-----------|
| `interactiveMapping` / `mapping` | `/admin/interactive-mapping` | `Map` / `PenTool` (lucide) |

i18n: `Admin.nav.*` in `messages/hy.json`, `ru.json`, `en.json`.

Optional children:

```text
/admin/interactive-mapping              → project list + progress
/admin/interactive-mapping/[projectId]  → 4-phase wizard
```

Deep links into phase editors:

```text
.../phases/masterplan
.../districts/[districtId]
.../buildings/[buildingId]/render
.../floors/[floorId]
```

### 7.2 UI rules

- Reuse Admin shell, `rounded-pill` nav, surfaces, sheets, buttons from existing admin/builder.
- Port **behavior** of `AdminPhaseCard` (locked / active / done), restyle with ToonExpo tokens.
- Do **not** copy Manvel fonts/CSS variables.
- Forms: React Hook Form + Zod (web) + Nest DTO validation (API).

### 7.3 Who uses it

- v1: **platform_admin** only (Admin portal).
- Later: reuse same feature under builder portal / admin company catalog scope (same pattern as existing visual-map reuse).

---

## 8. API surface (apps/api)

New or extended Nest module under visual-map / catalog (names illustrative).  
Entity create may **reuse** existing admin/portal catalog endpoints when they already cover the same fields.

| Method | Path | Purpose | Manvel source logic |
|--------|------|---------|---------------------|
| GET | `/api/v1/admin/interactive-mapping/projects` | List + phase progress | `admin/page.tsx` progress helper |
| GET | `/api/v1/admin/interactive-mapping/projects/:id` | Phase state + entities | `projects/[projectSlug]/page.tsx` |
| POST | `/api/v1/admin/media` | Images → R2 | replaces all `upload-*.ts` + `store-media` |
| PUT | `/api/v1/admin/…/canvases/:id` | Attach media, publish | masterplan/district/building/floor image attach |
| PUT | `/api/v1/admin/…/hotspots/:id` | Save marker + **polygon** | `saveDistrict|Building|Floor|Apartment*Mapping` |
| POST | `/api/v1/admin/…/hotspots` | Create region linked to entity | same |
| POST | `/api/v1/admin/…/buildings/:id/setup-floors` | Floor count + ensure Floor rows | `setup-building-floors.ts` |
| POST | existing catalog create project/building/floor/apartment (+ district if A) | Inline phase Create forms | `project-actions.ts` |

All writes: auth guard + `platform_admin` (and company scope if exposed to builders).

Contracts: add DTOs/types to `@toonexpo/contracts` (polygon payload, interaction type, phase progress, band/stack not needed server-side — client computes paths).

---

## 9. Web feature layout (apps/web)

Suggested clean tree (named exports only):

```text
apps/web/src/features/interactive-mapping/
  api/                 # typed Nest clients
  components/
    mapping-canvas/    # port MappingCanvas + handles + toolbar
    phase-card.tsx
    phase-wizard-page.tsx
    editors/           # masterplan / district / building / floor
  hooks/
  schemas/             # zod forms
  utils/               # mapping-math, coordinates, curved-polygon
  constants.ts
```

Public overlays: extend `features/visual-map` public components to render **polygon** hotspots (today only point markers), or share a thin SVG overlay util from interactive-mapping.

---

## 10. Port checklist (phased delivery)

### Wave 0 — Bootstrap

- [ ] Confirm SOURCE clone of https://github.com/ginosyan00/Defense.git
- [ ] This single doc present at TARGET `docs/TOONEXPO-INTEGRATION.md`
- [ ] Decisions already locked in §-1 (do not re-open)

### Wave 1 — Schema + contracts + R2 wiring

- [ ] Migration: polygon fields (+ District if A)
- [ ] Contracts + OpenAPI DTOs
- [ ] Ensure mapping images only via admin/portal media → R2

### Wave 2 — Drawing engine in ToonExpo UI

- [ ] Port `MappingCanvas` + math + tests (no Prisma)
- [ ] Sandbox page under Admin (temporary) for headed QA
- [ ] Match ToonExpo visual language

### Wave 3 — Nest persistence API

- [ ] CRUD regions with polygon + marker
- [ ] Phase progress endpoint
- [ ] Floor setup endpoint

### Wave 4 — Admin 4-phase wizard + sidebar

- [ ] `AdminNav` item + i18n
- [ ] Project list + phase cards
- [ ] Wire editors to API + R2 media pickers
- [ ] Publish / draft parity with existing visual maps

### Wave 5 — Public catalog consumption

- [ ] Render published polygons on project/building/floor pages
- [ ] Keep list fallback (ToonExpo mobile rule)
- [ ] E2E smoke for one happy path

### Wave 6 — Cleanup

- [ ] Remove sandbox if unused
- [ ] No unused Defense leftovers
- [ ] Docs: MODULE_STATUS + module 06 update

---

## 11. File → destination cheat sheet

**SOURCE repo:** https://github.com/ginosyan00/Defense.git (paths relative to repo root)  
**TARGET prefix:** `D:\Neetrino\ToonExpo\apps\web\src\features\interactive-mapping\` (unless noted)

| SOURCE path (Defense) | TARGET | Notes |
|-------------|--------|-------|
| `src/components/admin/MappingCanvas.tsx` | `components/mapping-canvas/` | Keep band/auto-stack |
| `src/components/admin/PolygonEditHandles.tsx` | same | |
| `src/components/admin/MappingToolbarIcons.tsx` | same | |
| `src/lib/admin/mapping-math.ts` | `utils/` or `packages/shared` | |
| `src/lib/admin/curved-polygon.ts` | `utils/` | |
| `src/lib/admin/polygon-transform.ts` | `utils/` | |
| `src/lib/coordinates.ts` | `utils/` | |
| `src/lib/mapping/*` | `utils/` + contracts | Trim dead code |
| `src/lib/format-marker-label.ts` | `utils/` | |
| `src/lib/media/prepare-image-upload.ts` | `utils/` | Then POST admin media |
| `src/components/admin/AdminPhaseCard.tsx` | `components/phase-card.tsx` | ToonExpo tokens |
| `src/components/admin/CreateProjectForm.tsx` | wizard forms / reuse catalog sheets | |
| `src/components/admin/BuildingFloorSetupForm.tsx` | `components/` + Nest | |
| `src/components/admin/AdminBuildingFloorUploadPicker.tsx` | `components/` | |
| `src/components/admin/*MappingEditor.tsx` | `components/editors/` | Nest client |
| `src/components/admin/*ImageUploader.tsx` | media upload wrappers | R2 only |
| `src/app/admin/page.tsx` + `projects/[projectSlug]/page.tsx` | Admin routes under `[locale]/admin/interactive-mapping/` | Progress logic |
| `src/lib/admin/mapping-actions.ts` | `apps/api` visual-map service | No Server Actions |
| `src/lib/admin/project-actions.ts` | Nest catalog or mapping module | |
| `src/lib/admin/setup-building-floors.ts` | Nest service | |
| `src/lib/admin/upload-*.ts` | Nest + R2 attach | |
| `src/lib/media/store-media.ts` | **do not port** | |
| `src/components/admin/Building3dMapper.tsx` | **do not port** | |
| `src/components/admin/FloorSvgMapper.tsx` | **do not port** | |
| `src/app/admin/mapping-lab/page.tsx` | optional temp QA only | |

---

## 12. Acceptance criteria

1. Admin sidebar shows a **separate** Interactive Mapping section.
2. Platform admin can run the full **§2.4 checklist** (all “Yes” rows) for a project.
3. All uploaded mapping images land in **R2** with `MediaAsset` rows (no Neon byte blobs, no `public/uploads` dependency).
4. Polygons persist and render on public catalog pages without drift across mobile/desktop widths (tests + manual QA).
5. Floor phase includes **band** + **auto-stack** tools (parity with Defense `MappingCanvas`).
6. `apps/web` has **zero** Prisma imports for this feature.
7. UI matches existing Admin (tokens, nav, typography) — not Defense prototype look.
8. Existing point-only visual maps keep working (backward compatible).
9. 3D mapper and FloorSvgMapper are **not** shipped.

---

## 13. Implementation order (practical)

1. Ensure this doc is at TARGET `docs/TOONEXPO-INTEGRATION.md`.  
2. Clone/fetch SOURCE: `https://github.com/ginosyan00/Defense.git`.  
3. Schema migration in `packages/db` (District + VisualHotspot polygon fields).  
4. Nest polygon APIs + contract types.  
5. Port canvas engine (+ band/stack) + unit tests into `apps/web` **from Defense**.  
6. Sidebar + phase wizard shell (wire §2.4 items).  
7. Wire uploads to R2 + save polygons.  
8. Public render.  
9. E2E + docs.

### Suggested commits (clean history)

1. `feat(db): district + visual hotspot polygon fields`
2. `feat(api): interactive mapping + polygon hotspot APIs`
3. `feat(web): mapping canvas engine from Defense`
4. `feat(admin): interactive mapping sidebar + 4-phase wizard`
5. `feat(web): public polygon overlays on catalog maps`
6. `test: mapping math + e2e smoke`

### If something cannot be ported 1:1

Write in the PR:

`GAP: <Defense path> → <why> → <ToonExpo equivalent or blocker>`

Never silently drop a §2.4 Yes item.

---

## 14. Reference links

| Repo | Path |
|------|------|
| **SOURCE GitHub** | https://github.com/ginosyan00/Defense.git |
| SOURCE Admin pages | https://github.com/ginosyan00/Defense/tree/main/src/app/admin |
| SOURCE Admin components | https://github.com/ginosyan00/Defense/tree/main/src/components/admin |
| SOURCE Admin libs | https://github.com/ginosyan00/Defense/tree/main/src/lib/admin |
| SOURCE docs | https://github.com/ginosyan00/Defense/tree/main/docs |
| **TARGET GitHub** | https://github.com/neetrino/ToonExpo_Ecosystem.git |
| TARGET local | `D:\Neetrino\ToonExpo` |
| TARGET tech card | `D:\Neetrino\ToonExpo\docs\TECH_CARD.md` |
| TARGET visual map module | `D:\Neetrino\ToonExpo\docs\02-ToonExpo-Ecosystem/01-Modules/06-Visual-Map-Hotspots/` |
| TARGET admin nav | `D:\Neetrino\ToonExpo\apps\web\src\features\admin\components\admin-nav.tsx` |
| TARGET R2 | `D:\Neetrino\ToonExpo\apps\api\src\media\r2-storage.service.ts` |

---

## 15. Decisions (LOCKED — see §-1)

Open questions are closed. Use the locked table in **§-1**. Do not block on asking the user again unless a locked decision is physically impossible in the current ToonExpo schema (then document the blocker and propose the smallest schema fix).

---

## 16. Audit note (2026-07-27)

Re-checked Admin surface against Defense layout (`src/app/admin/**`, `src/components/admin/**`, `src/lib/admin/**`, media/mapping).  
**Canonical SOURCE remote:** https://github.com/ginosyan00/Defense.git

**Doc coverage (this one file only):**

- START HERE paste prompt
- ZERO-OMISSION + locked decisions (§-1)
- Explicit SOURCE/TARGET GitHub URLs (§0, §14)
- Full route / component / lib inventories (§2.1–§2.3)
- Behavior checklist (§2.4)
- Explicit SKIP: `FloorSvgMapper`, `Building3dMapper`, `StoredMedia`
- Final agent self-check (§17)

**Intentionally out of Admin mapping scope (public site / CRM):** apartment consultation form, reservation rules, public journey chrome — not required for Admin Interactive Mapping port.

---

## 17. Agent self-check before saying “done”

Copy into the PR / final message — all boxes required:

```text
[ ] Cloned/used https://github.com/ginosyan00/Defense.git as SOURCE
[ ] District model (Option A) migrated
[ ] VisualHotspot polygon fields + backward-compatible points
[ ] AdminNav sidebar item + i18n hy/ru/en
[ ] Phase wizard (4 phases) with progress
[ ] Create project/district/building/apartment (or reused catalog APIs)
[ ] Masterplan / district / building render / floor plan uploads via R2
[ ] MappingCanvas ported with band + auto-stack
[ ] Polygon/marker save via Nest for all 4 phases
[ ] Building floor setup endpoint/UI
[ ] Floor plan upload picker
[ ] Dirty/save UX
[ ] Public polygon render (Wave 5)
[ ] Math unit tests green
[ ] No Prisma in apps/web for this feature
[ ] No 3D / FloorSvgMapper / StoredMedia shipped
[ ] §2.4 Yes rows 1–18 verified in PR description
```

---

*Last updated: 2026-07-27 — single-file brief; SOURCE = ginosyan00/Defense; no code ported yet.*
