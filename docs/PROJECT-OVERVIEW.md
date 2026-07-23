# Defanse — Project Overview

**Վերջին թարմացում.** 2026-07-23  
**Նպատակ.** Interactive real-estate navigation system՝ օգտատերը քայլում է  
`Project → District → Building → Floor → Apartment` հիերարխիայով և ընտրում է բնակարան նկարի վրա գծված տարածքների միջոցով։

---

## 1. Ինչ է այս նախագիծը

**Defanse** (workspace՝ `D:\Defanse`) վեբ հավելված է բնակելի համալիրի վաճառքի/նավիգացիայի համար։

| Մակարդակ | Public փորձ | Admin խնդիր |
|----------|-------------|-------------|
| Project | Masterplan / շրջանների ընտրություն | District hotspot-ներ |
| District | Շենքերի ընտրություն aerial/plan նկարի վրա | Building polygon/marker |
| Building | Հարկերի ընտրություն render նկարի վրա | Floor polygon/marker |
| Floor | Բնակարանների ընտրություն հատակագծի վրա | Apartment polygon/marker |
| Apartment | Մանրամասներ, գին, կարգավիճակ | Entity տվյալներ |

**Կարևոր որոշում (այս փուլ).** Հարկ/բնակարան ընտրությունը **ոչ WebGL / ոչ GLB**։  
Մոտեցումը՝ **նկար + admin գծագիր + SVG overlay + DB mapping**։

---

## 2. Տեխնոլոգիական stack

| Շերտ | Գործիք | Ինչու |
|------|--------|------|
| Framework | **Next.js 16** (App Router) | SSR/RSC, routing, server actions |
| UI | **React 19** + **Tailwind CSS 4** | Կոմպոնենտներ և styling |
| Լեզու | **TypeScript** (strict) | Type-safe domain մոդել |
| ORM / DB | **Prisma 6** + **Neon Postgres** | Relational model, hosted Postgres |
| Validation | **Zod** | Server action input validation |
| Tests | **Vitest** (+ Testing Library) | Unit tests (կոորդինատներ, mapping math) |
| Package manager | **pnpm** | Fast, disk-efficient installs |
| 3D (legacy/optional) | Three.js / R3F / Drei | Կախվածություն կա, բայց building floor picking-ը տեղափոխված է static render-ի |

### Գծագրի համար գրադարան

**Առանձին drawing library չկա** (ոչ Konva, ոչ Fabric, ոչ Leaflet)։

Օգտագործվում է.

- **Native SVG** (`<path>`, `<polyline>`, `<circle>`, `<image>`)
- **Սեփական editor**՝ `MappingCanvas` + `mapping-math`
- **React state**՝ draft կետեր, mode (select / marker / polygon)

**Ինչու ոչ Konva.** Այս use-case-ը hotspot mapping է (փակ polygon + marker), ոչ լիարժեք design tool։ SVG-ն բավարար է public accessibility-ի և `svgPath` պահման համար։ Konva-ն կավելացներ bundle/abstraction առանց էական օգուտի։

---

## 3. Հիմնական տեխնիկա՝ գծագրեր (Image + SVG Overlay)

```
┌─────────────────────────────────────┐
│  Raster background (floor plan PNG) │
│  + SVG layer (polygons / markers)   │
│  + Entity link (Apartment row)      │
└─────────────────────────────────────┘
```

### 3.1 Հոսք

1. Admin-ը բեռնում է հատակագծի/render նկարը։
2. Ընտրում է entity (օր. բնակարան 101)։
3. `Polygon` mode → կտորում է ≥3 կետ։
4. Draft = նարնջագույն գիծ (չպահպանված)։
5. **Պահպանել գծագիրը** / Enter → փակ path (`M … L … Z`)։
6. Server action գրում է `Apartment.svgPath` (և marker դաշտեր)։
7. Public էջը կարդում է նույն path-ը և նկարում է overlay։

### 3.2 Կոորդինատներ

- Pointer → **normalized 0…1** (նկարի `object-fit: contain` box-ի նկատմամբ)։
- Պահում/ցուցադրում՝ **viewBox pixel space** path string։
- Օգնական մոդուլներ՝
  - `src/lib/admin/mapping-math.ts`
  - `src/lib/coordinates.ts`
  - docs՝ `docs/interactive-mapping/coordinate-system.md`

### 3.3 Ինչ է երևում UI-ում

| Վիզուալ | Իմաստ |
|---------|--------|
| Նարնջագույն գիծ | Draft (չպահպանված) |
| Լցված beige տարածք | Պահպանված polygon |
| Շրջան marker | `markerX` / `markerY` + label |

---

## 4. Data model (կարճ)

**Domain hierarchy (Prisma).**

- `Project` → `District` → `Building` → `Floor` → `Apartment`

**Spatial դաշտեր (գործող մակարդակ).**

| Entity | Հիմնական spatial դաշտեր |
|--------|-------------------------|
| District / Building | `svgPath`, marker, `interactionType` |
| Floor | `floorPlanPreviewUrl`, `floorPlanImageWidth/Height`, floor-on-building path |
| Apartment | `svgPath`, `markerX/Y`, `markerLabel`, `interactionType`, status/price |

**Generic mapping մոդելներ (հաջորդ միգրացիայի համար).**

- `InteractiveAsset`, `InteractiveRegion`, `InteractiveMarker`, `MappingAuditLog`

Մանրամասներ՝ `docs/interactive-mapping/data-model.md`։

**Database.** Neon project (`defanse`), Postgres 17։

---

## 5. Ինչ է արվել (իրականացված)

### 5.1 Հիմք

- Next.js App Router նախագիծ, TypeScript, Tailwind
- Prisma schema + seed (շրջաններ, շենքեր, հարկեր, բնակարաններ)
- Admin և public route կառուցվածք

### 5.2 Interactive mapping (գործող)

| Մակարդակ | Admin | Public |
|----------|-------|--------|
| District plan | Building polygon editor + image upload | District plan overlays |
| Building render | Floor polygons on static render image | `BuildingRenderViewer` (ոչ R3F picking) |
| Floor plan | `FloorApartmentMappingEditor` + upload | `InteractiveFloorPlan` + `FloorPlanSvg` |

### 5.3 Floor / apartment mapping (կարևոր մաս)

- Upload՝ `FloorPlanImageUploader` → `public/uploads/...` կամ static `/floor-plans/...`
- Editor՝ `FloorApartmentMappingEditor` + shared `MappingCanvas`
- Persist՝ `saveApartmentImageMapping` (Zod + Prisma + `revalidatePath`)
- Public՝ միայն **իրական** `svgPath` raster հատակագծի վրա (procedural fallback միայն եթե նկար չկա)
- Sibling sync՝ նույն `floorPlanPreviewUrl` + նույն հարկի համար գծագիրը կրկնօրինակվում է district-ի մյուս շենքերին (որպեսզի A1-ում գծածը երևա նաև A2-ում, եթե նույն հատակագիծն է)

### 5.4 Mapping lab (universal MVP)

- `/admin/mapping-lab`
- `src/components/mapping-editor/`
- Նպատակ՝ աստիճանաբար տեղափոխել բոլոր մակարդակները `Interactive*` մոդելների վրա

### 5.5 UX / bugfix-եր (2026-07-23)

- Հանվել է public-ի **կեղծ** fallback polygon-ները uploaded հատակագծի վրա (admin-ում «no polygon», public-ում երևում էր հորինված ուղղանկյուն)
- Draft-ը mode փոխելիս այլևս լուռ չի ջնջվում (≥3 կետ → auto-commit)
- Admin-ում ավելացվել է **«Դիտել public էջը»**՝ նույն building/floor-ի համար
- Public վերնագիրում երևում է շենքի անունը (`Building · Հարկ N`)

---

## 6. Կարևոր ֆայլեր

### Admin

| Ֆայլ | Դեր |
|------|-----|
| `src/components/admin/MappingCanvas.tsx` | Գծման canvas (select / marker / polygon) |
| `src/components/admin/FloorApartmentMappingEditor.tsx` | Բնակարան ↔ գծագիր կապ |
| `src/lib/admin/mapping-actions.ts` | Server actions (save mapping) |
| `src/lib/admin/mapping-math.ts` | Normalized ↔ SVG path |
| `src/lib/admin/upload-floor-plan.ts` | Հատակագծի upload |
| `src/app/admin/.../floors/[floorNumber]/page.tsx` | Floor admin էջ |

### Public

| Ֆայլ | Դեր |
|------|-----|
| `src/lib/floor/get-floor-plan.ts` | Floor payload DB-ից |
| `src/components/floor/FloorPlanSvg.tsx` | SVG overlays |
| `src/components/floor/InteractiveFloorPlan.tsx` | Zoom/pan + list + tooltip |
| `src/components/building/BuildingRenderViewer.tsx` | Building static render + floors |

### Docs

| Փաթեթ | Բովանդակություն |
|-------|-----------------|
| `docs/interactive-mapping/` | Admin architecture, data model, coordinates, editor behavior |
| `docs/interactive-real-estate/` | Վաղ architecture / contracts |
| `docs/PROJECT-OVERVIEW.md` | Այս ֆայլը — ամբողջական ակնարկ |

---

## 7. Public vs Admin — ինչպես կարդալ

1. **Լցված տարածք admin-ում** = պահված է DB-ում։
2. **Նարնջագույն գիծ** = draft, դեռ չի գրվել DB։
3. **Public-ում երևում է միայն պահված `svgPath`**։
4. Գծագրերը կապված են **կոնկրետ Building + Floor**-ի հետ (ոչ «մեկ նկար բոլոր URL-ների համար»), բայց նույն հատակագծի URL ունեցող sibling շենքերին save-ի ժամանակ sync է լինում։
5. Uploader-ի preview-ն **մաքուր նկար** է՝ առանց polygon-ների։ Իրական գծագիրը ներքևի `MappingCanvas`-ում է։

---

## 8. Գործարկում

```bash
pnpm install
# .env → DATABASE_URL (Neon)
pnpm db:generate
pnpm db:push          # կամ db:migrate
pnpm db:seed
pnpm run dev          # http://localhost:3000
```

| Script | Նշանակություն |
|--------|----------------|
| `pnpm run dev` | Dev server |
| `pnpm run typecheck` | `tsc --noEmit` |
| `pnpm run lint` | ESLint |
| `pnpm run test` | Vitest |
| `pnpm run build` | Production build |

**Օրինակ URL-ներ.**

- Public floor՝ `/projects/defense-residence/districts/district-a/buildings/a1/floors/1`
- Admin mapping՝ `/admin/projects/defense-residence/districts/district-a/buildings/a1/floors/1`
- Mapping lab՝ `/admin/mapping-lab`

---

## 9. Assets

| Asset | Տիպիկ path |
|-------|------------|
| District aerial | `/masterplans/district-a-aerial.png` |
| Building render | `/buildings/building-render.png` |
| Floor plan | `/floor-plans/typical-floor-plan.png` |
| Uploads | `public/uploads/{buildings,districts,floors}/` (gitignored binaries) |

---

## 10. Ինչ է մնացել / backlog

- Լրիվ միգրացիա բոլոր մակարդակներից դեպի `InteractiveAsset` / `InteractiveRegion`
- Publish pipeline, roles, audit trail
- Auth-ով պաշտպանված admin
- E2E tests (headed browser sign-off)
- Vertex drag / ավելի հարուստ polygon edit UX (անհրաժեշտության դեպքում)
- Implementation-plan-ի status աղյուսակի թարմացում փաստացի progress-ի հետ

Մանրամասն պլաններ՝ `docs/interactive-mapping/implementation-plan.md`։

---

## 11. Ճարտարապետական սկզբունքներ

1. **Source of truth** = domain entity (Apartment/Building/…), ոչ միայն UI state։
2. **Drawing ≠ inventing geometry on public** — public-ը չպետք է հորինի polygon, եթե admin-ը չի պահել։
3. **Normalized input, absolute SVG storage** — resize/zoom-ին դիմացկուն։
4. **Named exports, TypeScript strict, no secrets in repo**։
5. **Մեկ խնդիր՝ մեկ section** UI-ում — admin գործիքները պարզ պահել (Select / Marker / Polygon)։

---

## 12. Ամփոփում մեկ նախադասությամբ

Defanse-ը Next.js + Prisma/Neon վրա կառուցված interactive real-estate նավիգատոր է, որտեղ ընտրությունը արվում է **admin-ում գծված SVG polygon/marker-ներով** նկարների վրա, առանց Konva/WebGL floor-picking-ի այս փուլում։
