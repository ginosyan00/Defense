# Interactive Mapping — Editor Behavior

## Tools (MVP → full)

| Tool | MVP | Full |
|------|-----|------|
| Select | ✓ | ✓ |
| Draw polygon | ✓ | ✓ |
| Draw rectangle | — | ✓ |
| Move vertex | ✓ | ✓ |
| Add/delete vertex | partial | ✓ |
| Move shape | — | ✓ |
| Undo / Redo | ✓ | ✓ |
| Zoom / Pan / Reset | ✓ | ✓ |
| Preview | stub | ✓ |
| Draft save / Publish | stub API | ✓ |

## Polygon draw flow

1. Activate **Draw polygon**
2. Click to add vertices (≥3)
3. Close via Enter, or click near first point
4. Escape cancels in-progress drawing
5. Closed shape becomes selected region (draft)
6. Mapping form binds destination (later phases)

## Keyboard (MVP)

- `Enter` — close polygon
- `Escape` — cancel drawing / deselect
- `Delete` — delete selected region
- `Ctrl/Cmd+Z` — undo
- `Ctrl/Cmd+Shift+Z` — redo
- `+` / `-` — zoom
- `0` — reset view

## History

History stores region snapshots (JSON-serializable). Autosave drafts must not publish.

## Validation (before publish)

- ≥3 unique points
- points in [0,1]
- closed polygon
- destination required (when publishing)
- parent/child entity consistency (later)
- warn on self-intersection

## Preview

Editing handles hidden; hover/click simulate public behavior without leaving admin (confirm before navigate).
