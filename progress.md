# Progress — Interactive Real Estate + Mapping Admin

Last updated: 2026-07-23

## Fix — polygon «չի պահպանվել» (2026-07-23)

**Root cause:** DB-ում `svgPath` կար, բայց public overlay-ում idle polygon-ը գրեթե անտեսանելի էր (`opacity ≈ 0.01`), իսկ `interactionType=POLYGON`-ի դեպքում marker-ը չէր երևում։ Admin-ում գծելը մնում էր local state մինչև «Պահպանել».

**Fix:**
- Public idle polygons՝ տեսանելի fill + stroke
- Polygon close → ավտոմատ DB save (district + building editors)
- MARKER → MARKER_AND_POLYGON երբ polygon է ավելացվում
- Dirty `*` indicator + հաղորդագրություններ

**Interactive mapping admin — Phase 0–2 MVP** (docs + schema + universal editor sandbox).

Not claiming full admin panel complete. Phases 3–8 pending.

## Phase 0–2 deliverables

| Item | Status |
|------|--------|
| Repo audit | Done |
| `docs/interactive-mapping/admin-architecture.md` | Done |
| `docs/interactive-mapping/data-model.md` | Done |
| `docs/interactive-mapping/coordinate-system.md` | Done |
| `docs/interactive-mapping/editor-behavior.md` | Done |
| `docs/interactive-mapping/implementation-plan.md` | Done |
| Prisma `InteractiveAsset` / `InteractiveRegion` / `InteractiveMarker` / `MappingAuditLog` | Done (`db push`) |
| `SUPER_ADMIN` role enum | Done |
| Shared mapping utilities (`geometry`, `transform`, `history`, `routes`) | Done |
| `InteractiveImageMappingEditor` MVP | Done |
| Mapping lab `/admin/mapping-lab` | Done |
| Unit tests (360→1920 drift, undo/redo, routes, geometry) | Done |

## Verification (2026-07-23)

| Check | Result |
|-------|--------|
| `pnpm run typecheck` | Pass |
| `pnpm run lint` | Pass |
| `pnpm run test` | Pass — **22/22** |
| `pnpm run build` | Pass (includes `/admin/mapping-lab`) |
| Headed browser draw/zoom/pan QA | **Pending — open `/admin/mapping-lab` and exercise tools** |

## How to verify in browser

1. Open `http://localhost:3000/admin/mapping-lab`
2. Draw polygon (≥3 clicks, Enter to close)
3. Drag vertices, Undo/Redo
4. Zoom / Pan / Reset — shapes must stay on image
5. Resize window 360–1920 — polygons must not drift

## Next (Phase 3+)

1. Persist lab regions to `InteractiveAsset` / `InteractiveRegion`
2. Project masterplan mapping UI wired to districts
3. Draft autosave + explicit publish
4. Public `InteractiveImageViewer`
5. Auth, permissions, audit, Playwright E2E

## Key URLs

```text
http://localhost:3000/admin/mapping-lab
http://localhost:3000/admin
http://localhost:3000/projects/defense-residence
```
