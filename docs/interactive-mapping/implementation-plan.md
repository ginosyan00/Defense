# Interactive Mapping — Implementation Plan

## Phase status

| Phase | Scope | Status |
|-------|-------|--------|
| 0 | Audit + docs | Done (2026-07-23) |
| 1 | InteractiveAsset / Region / Marker schema | Done (`db push`) |
| 2 | Universal drawing editor MVP | Done — `/admin/mapping-lab` |
| 3 | Project masterplan mapping UI | Pending |
| 4 | District building mapping | Pending |
| 5 | Building render → floor polygons | Pending |
| 6 | Floor plan → apartment polygons | Pending |
| 7 | Public InteractiveImageViewer | Pending |
| 8 | Validation, auth, audit, E2E | Pending |

## Phase 2 MVP acceptance

- [x] Placeholder image in `/admin/mapping-lab`
- [x] Draw / close / select / edit vertices
- [x] Undo / redo
- [x] Zoom / pan without corrupting stored points
- [x] Unit tests prove 360→1920 alignment
- [x] lint / typecheck / tests / production build green
- [ ] Headed browser sign-off (manual)

## Notes

Legacy `/admin` editors remain until migration; new work lives under `src/components/mapping-editor` + `Interactive*` models.
