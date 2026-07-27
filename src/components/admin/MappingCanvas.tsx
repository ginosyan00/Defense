"use client";

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
} from "react";
import {
  appendSvgPaths,
  bandPolygonFromEdge,
  normalizedPointsToSvgPath,
  offsetNormalizedPath,
  pathCentroid,
  pointerToNormalized,
  stackBandsFromQuad,
  svgPathToNormalizedPoints,
  type NormPoint,
} from "@/lib/admin/mapping-math";
import {
  polygonShapeToSvgPath,
  svgPathToPolygonShape,
  type PolygonShape,
} from "@/lib/admin/curved-polygon";
import { getContainedImageBounds, clampNormalized } from "@/lib/coordinates";
import { formatMarkerLabel } from "@/lib/format-marker-label";
import {
  AutoStackIcon,
  BandStripIcon,
  ClearPointsIcon,
  MarkerPinIcon,
  PolygonShapeIcon,
  SaveCheckIcon,
  SelectCursorIcon,
  TrashPointIcon,
  UndoPointIcon,
} from "@/components/admin/MappingToolbarIcons";
import { PolygonEditHandles } from "@/components/admin/PolygonEditHandles";

export type MappingEntity = {
  id: string;
  label: string;
  title: string;
  markerX: number;
  markerY: number;
  svgPath: string | null;
};

export type MappingBulkPathUpdate = {
  id: string;
  svgPath: string;
  markerX: number;
  markerY: number;
};

export type MappingCanvasHandle = {
  /** Commits open draft (≥1 point). Returns saved svgPath, or null if nothing to save. */
  flushPolygonDraft: () => string | null;
  hasOpenDraft: () => boolean;
  getDraftPointCount: () => number;
};

type EditorMode =
  | "select"
  | "place-marker"
  | "draw-polygon"
  | "edit-polygon"
  | "draw-band"
  | "auto-stack";

type MappingCanvasProps = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  entities: MappingEntity[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onChangeEntity: (
    id: string,
    patch: Partial<
      Pick<MappingEntity, "markerX" | "markerY" | "svgPath">
    >,
  ) => void;
  onPolygonClosed?: (id: string, svgPath: string) => void;
  onPolygonDeleted?: (id: string) => void;
  /** Floors preset adds Band + Auto stack tools. */
  toolPreset?: "basic" | "floors";
  /** Auto-stack assigns paths to all entities (index 0 = bottom floor). */
  onBulkPaths?: (updates: MappingBulkPathUpdate[]) => void;
};

export const MappingCanvas = forwardRef<MappingCanvasHandle, MappingCanvasProps>(
  function MappingCanvas(
    {
      imageUrl,
      imageWidth,
      imageHeight,
      viewBoxWidth,
      viewBoxHeight,
      entities,
      selectedId,
      onSelect,
      onChangeEntity,
      onPolygonClosed,
      onPolygonDeleted,
      toolPreset = "basic",
      onBulkPaths,
    },
    ref,
  ) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<EditorMode>("select");
    const [draftPoints, setDraftPoints] = useState<NormPoint[]>([]);
    const [editShape, setEditShape] = useState<PolygonShape | null>(null);
    const [selectedDraftIndex, setSelectedDraftIndex] = useState<number | null>(
      null,
    );
    const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const dragRef = useRef<{ id: string } | null>(null);
    const draftRef = useRef(draftPoints);
    const editShapeRef = useRef<PolygonShape | null>(null);
    const selectedDraftIndexRef = useRef(selectedDraftIndex);
    const selectedIdRef = useRef(selectedId);
    const entitiesRef = useRef(entities);
    const modeRef = useRef(mode);
    const replaceOnCommitRef = useRef(false);
    const toolPresetRef = useRef(toolPreset);
    const [cursorPoint, setCursorPoint] = useState<NormPoint | null>(null);

    useEffect(() => {
      draftRef.current = draftPoints;
    }, [draftPoints]);
    useEffect(() => {
      editShapeRef.current = editShape;
    }, [editShape]);
    useEffect(() => {
      toolPresetRef.current = toolPreset;
    }, [toolPreset]);
    useEffect(() => {
      selectedDraftIndexRef.current = selectedDraftIndex;
    }, [selectedDraftIndex]);
    useEffect(() => {
      selectedIdRef.current = selectedId;
    }, [selectedId]);
    useEffect(() => {
      entitiesRef.current = entities;
    }, [entities]);
    useEffect(() => {
      modeRef.current = mode;
    }, [mode]);

    const measure = useCallback(() => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      setBounds(
        getContainedImageBounds(
          { width: rect.width, height: rect.height },
          { width: imageWidth, height: imageHeight },
        ),
      );
    }, [imageHeight, imageWidth]);

    useEffect(() => {
      measure();
      const el = viewportRef.current;
      if (!el) return;
      const observer = new ResizeObserver(() => measure());
      observer.observe(el);
      return () => observer.disconnect();
    }, [measure]);

    const selected = entities.find((entity) => entity.id === selectedId) ?? null;
    const isDrawingMode =
      mode === "draw-polygon" ||
      mode === "edit-polygon" ||
      mode === "draw-band" ||
      mode === "auto-stack" ||
      mode === "place-marker";

    const readNormalized = (
      event: { clientX: number; clientY: number },
      options?: { clamp?: boolean },
    ) => {
      const el = viewportRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return pointerToNormalized(
        { clientX: event.clientX, clientY: event.clientY },
        rect,
        { width: imageWidth, height: imageHeight },
        options,
      );
    };

    const commitDraft = useCallback(
      (points: NormPoint[], entityId: string) => {
        if (points.length < 1) return null;

        const editing = modeRef.current === "edit-polygon";
        const shaped = editShapeRef.current;
        const nextSegment =
          editing && shaped && shaped.vertices.length > 0
            ? polygonShapeToSvgPath(shaped, viewBoxWidth, viewBoxHeight)
            : normalizedPointsToSvgPath(points, viewBoxWidth, viewBoxHeight);
        if (!nextSegment) return null;

        const existing =
          entitiesRef.current.find((entity) => entity.id === entityId)
            ?.svgPath ?? null;
        // Floors: never stack multiple strokes — always replace.
        const shouldReplace =
          replaceOnCommitRef.current ||
          editing ||
          toolPresetRef.current === "floors" ||
          !existing;
        const svgPath = shouldReplace
          ? nextSegment
          : appendSvgPaths(existing, nextSegment);
        replaceOnCommitRef.current = false;

        const centroid = pathCentroid(
          editing && shaped ? shaped.vertices : points,
        );
        onChangeEntity(entityId, {
          svgPath,
          markerX: centroid.x,
          markerY: centroid.y,
        });
        onPolygonClosed?.(entityId, svgPath);
        draftRef.current = [];
        editShapeRef.current = null;
        setDraftPoints([]);
        setEditShape(null);
        setSelectedDraftIndex(null);
        setMode(editing ? "select" : "draw-polygon");
        return svgPath;
      },
      [onChangeEntity, onPolygonClosed, viewBoxHeight, viewBoxWidth],
    );

    const commitBand = useCallback(
      (points: NormPoint[], entityId: string) => {
        if (points.length < 3) return null;
        const band = bandPolygonFromEdge(points[0]!, points[1]!, points[2]!);
        replaceOnCommitRef.current = true;
        const svgPath = normalizedPointsToSvgPath(
          band,
          viewBoxWidth,
          viewBoxHeight,
        );
        if (!svgPath) return null;
        const centroid = pathCentroid(band);
        onChangeEntity(entityId, {
          svgPath,
          markerX: centroid.x,
          markerY: centroid.y,
        });
        onPolygonClosed?.(entityId, svgPath);
        draftRef.current = [];
        setDraftPoints([]);
        setSelectedDraftIndex(null);
        setMode("draw-band");
        return svgPath;
      },
      [onChangeEntity, onPolygonClosed, viewBoxHeight, viewBoxWidth],
    );

    const commitAutoStack = useCallback(
      (points: NormPoint[]) => {
        if (points.length < 4 || !onBulkPaths) return false;
        const list = entitiesRef.current;
        if (list.length === 0) return false;
        const bands = stackBandsFromQuad(
          points[0]!,
          points[1]!,
          points[2]!,
          points[3]!,
          list.length,
        );
        // entities assumed ascending floorNumber (1 at bottom → last band).
        const updates: MappingBulkPathUpdate[] = list.map((entity, index) => {
          const band = bands[list.length - 1 - index] ?? bands[0]!;
          const svgPath = normalizedPointsToSvgPath(
            band,
            viewBoxWidth,
            viewBoxHeight,
          );
          const centroid = pathCentroid(band);
          return {
            id: entity.id,
            svgPath,
            markerX: centroid.x,
            markerY: centroid.y,
          };
        });
        onBulkPaths(updates);
        draftRef.current = [];
        setDraftPoints([]);
        setSelectedDraftIndex(null);
        setMode("select");
        return true;
      },
      [onBulkPaths, viewBoxHeight, viewBoxWidth],
    );

    const closePolygon = useCallback(() => {
      const entityId = selectedIdRef.current;
      if (!entityId) return;
      const points = draftRef.current;
      if (points.length < 1) return;
      commitDraft(points, entityId);
    }, [commitDraft]);

    const clearDraft = useCallback(() => {
      draftRef.current = [];
      editShapeRef.current = null;
      setDraftPoints([]);
      setEditShape(null);
      setSelectedDraftIndex(null);
    }, []);

    const replaceDraftPoints = useCallback((next: NormPoint[]) => {
      draftRef.current = next;
      setDraftPoints(next);
    }, []);

    const replaceEditShape = useCallback((next: PolygonShape) => {
      editShapeRef.current = next;
      setEditShape(next);
      draftRef.current = next.vertices;
      setDraftPoints(next.vertices);
    }, []);

    const updateDraftPoints = useCallback(
      (updater: (prev: NormPoint[]) => NormPoint[]) => {
        setDraftPoints((prev) => {
          const next = updater(prev);
          draftRef.current = next;
          return next;
        });
      },
      [],
    );

    const deleteSelectedDraftPoint = useCallback(() => {
      const index = selectedDraftIndexRef.current;
      if (index == null) return;
      updateDraftPoints((prev) => prev.filter((_, i) => i !== index));
      setSelectedDraftIndex(null);
    }, [updateDraftPoints]);

    const undoLastDraftPoint = useCallback(() => {
      updateDraftPoints((prev) => {
        if (prev.length === 0) return prev;
        const next = prev.slice(0, -1);
        setSelectedDraftIndex((current) => {
          if (current == null) return null;
          if (current >= next.length) return null;
          return current;
        });
        return next;
      });
    }, [updateDraftPoints]);

    const discardGuideDraft = useCallback(() => {
      clearDraft();
      return true;
    }, [clearDraft]);

    /** Commit open draft when leaving tools. Returns false if cancelled. */
    const resolveOpenDraft = useCallback(() => {
      const draft = draftRef.current;
      if (draft.length === 0) return true;
      const currentMode = modeRef.current;
      if (currentMode === "draw-band" || currentMode === "auto-stack") {
        return discardGuideDraft();
      }
      const entityId = selectedIdRef.current;
      if (!entityId) return false;
      if (currentMode === "edit-polygon") {
        replaceOnCommitRef.current = true;
      }
      return commitDraft(draft, entityId) != null;
    }, [commitDraft, discardGuideDraft]);

    const changeMode = useCallback(
      (next: EditorMode) => {
        if (next === mode) return;
        if (!resolveOpenDraft()) return;
        setMode(next);
        if (
          next === "draw-polygon" ||
          next === "edit-polygon" ||
          next === "draw-band" ||
          next === "auto-stack"
        ) {
          replaceOnCommitRef.current = next === "edit-polygon";
          if (next !== "edit-polygon") clearDraft();
        }
      },
      [clearDraft, mode, resolveOpenDraft],
    );

    const nudgeSelection = useCallback(
      (dx: number, dy: number) => {
        if (draftRef.current.length > 0) {
          updateDraftPoints((prev) =>
            prev.map((point) => ({
              x: clampNormalized(point.x + dx),
              y: clampNormalized(point.y + dy),
            })),
          );
          return;
        }
        const entityId = selectedIdRef.current;
        if (!entityId) return;
        const entity = entitiesRef.current.find((item) => item.id === entityId);
        if (!entity?.svgPath) return;
        const svgPath = offsetNormalizedPath(
          entity.svgPath,
          dx,
          dy,
          viewBoxWidth,
          viewBoxHeight,
        );
        onChangeEntity(entityId, {
          svgPath,
          markerX: clampNormalized(entity.markerX + dx),
          markerY: clampNormalized(entity.markerY + dy),
        });
      },
      [onChangeEntity, updateDraftPoints, viewBoxHeight, viewBoxWidth],
    );

    useImperativeHandle(
      ref,
      () => ({
        flushPolygonDraft: () => {
          const entityId = selectedIdRef.current;
          if (!entityId) return null;
          const currentMode = modeRef.current;
          if (currentMode === "draw-band") {
            return commitBand(draftRef.current, entityId);
          }
          if (currentMode === "auto-stack") return null;
          if (currentMode === "edit-polygon") {
            replaceOnCommitRef.current = true;
          }
          return commitDraft(draftRef.current, entityId);
        },
        hasOpenDraft: () => draftRef.current.length > 0,
        getDraftPointCount: () => draftRef.current.length,
      }),
      [commitBand, commitDraft],
    );

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        const target = event.target;
        if (
          target instanceof HTMLElement &&
          (target.tagName === "INPUT" ||
            target.tagName === "TEXTAREA" ||
            target.tagName === "SELECT" ||
            target.isContentEditable)
        ) {
          return;
        }

        const step = event.shiftKey ? 0.01 : 0.003;
        if (event.key === "ArrowLeft") {
          event.preventDefault();
          nudgeSelection(-step, 0);
          return;
        }
        if (event.key === "ArrowRight") {
          event.preventDefault();
          nudgeSelection(step, 0);
          return;
        }
        if (event.key === "ArrowUp") {
          event.preventDefault();
          nudgeSelection(0, -step);
          return;
        }
        if (event.key === "ArrowDown") {
          event.preventDefault();
          nudgeSelection(0, step);
          return;
        }

        if (
          event.key === "Enter" &&
          (modeRef.current === "draw-polygon" ||
            modeRef.current === "edit-polygon") &&
          draftRef.current.length >= 1
        ) {
          event.preventDefault();
          if (modeRef.current === "edit-polygon") {
            replaceOnCommitRef.current = true;
          }
          closePolygon();
          return;
        }

        if (
          (event.key === "Delete" || event.key === "Backspace") &&
          selectedDraftIndexRef.current != null
        ) {
          event.preventDefault();
          deleteSelectedDraftPoint();
          return;
        }

        const isUndoKey =
          (event.key === "z" || event.key === "Z") &&
          (event.ctrlKey || event.metaKey) &&
          !event.shiftKey;
        if (
          (isUndoKey || event.key === "Backspace") &&
          draftRef.current.length > 0
        ) {
          event.preventDefault();
          undoLastDraftPoint();
          return;
        }

        if (event.key === "Escape") {
          if (selectedDraftIndexRef.current != null) {
            setSelectedDraftIndex(null);
            return;
          }
          clearDraft();
          setMode("select");
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [
      clearDraft,
      closePolygon,
      deleteSelectedDraftPoint,
      nudgeSelection,
      undoLastDraftPoint,
    ]);

    const onCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (dragRef.current) return;
      const point = readNormalized(event);
      if (!point) return;

      if (mode === "auto-stack") {
        updateDraftPoints((prev) => {
          const next = [...prev, point];
          if (next.length >= 4) {
            queueMicrotask(() => {
              commitAutoStack(next.slice(0, 4));
            });
            return next.slice(0, 4);
          }
          return next;
        });
        return;
      }

      if (!selectedId) return;

      if (mode === "place-marker") {
        onChangeEntity(selectedId, { markerX: point.x, markerY: point.y });
        return;
      }

      if (mode === "draw-band") {
        updateDraftPoints((prev) => {
          const next = [...prev, point];
          if (next.length >= 3) {
            const entityId = selectedId;
            queueMicrotask(() => {
              commitBand(next.slice(0, 3), entityId);
            });
            return next.slice(0, 3);
          }
          return next;
        });
        return;
      }

      if (mode === "draw-polygon") {
        if (event.altKey) {
          const threshold = 0.02;
          const nearIndex = draftRef.current.findIndex(
            (existing) =>
              Math.hypot(existing.x - point.x, existing.y - point.y) <=
              threshold,
          );
          if (nearIndex >= 0) {
            setSelectedDraftIndex((current) =>
              current === nearIndex ? null : nearIndex,
            );
            return;
          }
        }
        setSelectedDraftIndex(null);
        updateDraftPoints((prev) => [...prev, point]);
      }

      // edit-polygon: reshape via handles only (no new click points)
    };

    const deletePolygon = () => {
      if (!selectedId || !selected?.svgPath) return;
      if (
        !window.confirm(
          "Ջնջե՞լ այս գծագիրը։ Կարող ես հետո նոր polygon գծել։",
        )
      ) {
        return;
      }
      onChangeEntity(selectedId, { svgPath: null });
      onPolygonDeleted?.(selectedId);
      clearDraft();
      setMode("select");
    };

    const startFreshPolygon = () => {
      if (!selectedId) return;
      if (selected?.svgPath) {
        if (
          !window.confirm(
            "Ջնջե՞լ հին գծագիրը և սկսել նորը։ Հինը կպահպանվի որպես ջնջված։",
          )
        ) {
          return;
        }
        onChangeEntity(selectedId, { svgPath: null });
        onPolygonDeleted?.(selectedId);
      }
      replaceOnCommitRef.current = false;
      clearDraft();
      setMode("draw-polygon");
    };

    const onMarkerPointerDown = (
      event: ReactPointerEvent<HTMLButtonElement>,
      id: string,
    ) => {
      event.stopPropagation();
      onSelect(id);
      dragRef.current = { id };
      event.currentTarget.setPointerCapture(event.pointerId);
    };

    const onMarkerPointerMove = (
      event: ReactPointerEvent<HTMLButtonElement>,
    ) => {
      if (!dragRef.current) return;
      const point = readNormalized(event);
      if (!point) return;
      onChangeEntity(dragRef.current.id, {
        markerX: point.x,
        markerY: point.y,
      });
    };

    const onMarkerPointerUp = () => {
      dragRef.current = null;
    };

    const basicTools = [
      ["select", "Ընտրել", SelectCursorIcon],
      ["place-marker", "Marker", MarkerPinIcon],
      ["draw-polygon", "Polygon", PolygonShapeIcon],
    ] as const;

    const floorTools =
      toolPreset === "floors"
        ? ([
            ["draw-band", "Գոտի", BandStripIcon],
            ["auto-stack", "Ավտո", AutoStackIcon],
          ] as const)
        : [];

    const hintText = (() => {
      if (mode === "draw-band") {
        return "Գոտի · 3 կտտոց՝ ձախ-վերև → աջ-վերև → ներքևի եզր։";
      }
      if (mode === "auto-stack") {
        return `Ավտո հարկեր · 4 կտտոց՝ TL → TR → BR → BL (${entities.length} հարկ)։`;
      }
      if (mode === "edit-polygon") {
        return "Եզրի բաց/մանուշակագույն կետը քաշիր՝ կլորացնելու համար։ Alt+click՝ ուղղել։";
      }
      if (toolPreset === "floors") {
        return "Արագ՝ Ավտո / Գոտի։ Խմբագրել · քաշել՝ ձևը ադապտացնելու համար։";
      }
      return "Save-ից հետո հաջորդ կտտոցը սկսում է նոր գիծ (հինը մնում է)։ Խմբագրել · քաշել՝ ձևը փոխելու համար։";
    })();

    const bandPreview =
      mode === "draw-band" && draftPoints.length >= 3
        ? bandPolygonFromEdge(draftPoints[0]!, draftPoints[1]!, draftPoints[2]!)
        : null;

    return (
      <div className="space-y-3">
        <div
          className="flex flex-wrap gap-2"
          role="toolbar"
          aria-label="Mapping tools"
        >
          {[...basicTools, ...floorTools].map(([value, label, Icon]) => (
            <button
              key={value}
              type="button"
              title={label}
              aria-label={label}
              className={`inline-flex items-center gap-1.5 border px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] ${
                mode === value
                  ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                  : "border-[var(--mp-line)]"
              }`}
              onClick={() => changeMode(value)}
            >
              <Icon />
              <span className="hidden sm:inline">{label}</span>
            </button>
          ))}
          {selected?.svgPath ? (
            <>
              <button
                type="button"
                className="border border-[var(--mp-line)] px-3 py-1.5 text-xs uppercase tracking-[0.14em]"
                onClick={() => {
                  if (!selected.svgPath) return;
                  if (!resolveOpenDraft()) return;
                  replaceOnCommitRef.current = true;
                  setMode("edit-polygon");
                  setSelectedDraftIndex(null);
                  replaceEditShape(
                    svgPathToPolygonShape(
                      selected.svgPath,
                      viewBoxWidth,
                      viewBoxHeight,
                    ),
                  );
                }}
              >
                Խմբագրել · քաշել
              </button>
              <button
                type="button"
                className="border border-[var(--mp-line)] px-3 py-1.5 text-xs uppercase tracking-[0.14em]"
                onClick={() => {
                  if (!resolveOpenDraft()) return;
                  startFreshPolygon();
                }}
              >
                Նոր polygon
              </button>
              <button
                type="button"
                className="border border-red-700/40 px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-red-800"
                onClick={deletePolygon}
              >
                Ջնջել polygon
              </button>
            </>
          ) : null}
          {mode === "draw-polygon" ||
          mode === "edit-polygon" ||
          ((mode === "draw-band" || mode === "auto-stack") &&
            draftPoints.length > 0) ? (
            <>
              {mode === "draw-polygon" || mode === "edit-polygon" ? (
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-40"
                  onClick={() => {
                    if (mode === "edit-polygon") {
                      replaceOnCommitRef.current = true;
                    }
                    closePolygon();
                  }}
                  disabled={draftPoints.length < 1}
                  title={`Պահպանել գծագիրը (${draftPoints.length} կետ)`}
                  aria-label={`Պահպանել գծագիրը, ${draftPoints.length} կետ`}
                >
                  <SaveCheckIcon />
                  <span>{draftPoints.length}</span>
                </button>
              ) : null}
              <button
                type="button"
                className="inline-flex items-center justify-center border border-red-700/40 px-2.5 py-1.5 text-red-800 disabled:opacity-40"
                onClick={deleteSelectedDraftPoint}
                disabled={selectedDraftIndex == null}
                title="Ջնջել ընտրված կետը (Delete)"
                aria-label="Ջնջել ընտրված կետը"
              >
                <TrashPointIcon />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center border border-[var(--mp-line)] px-2.5 py-1.5 disabled:opacity-40"
                onClick={undoLastDraftPoint}
                disabled={draftPoints.length === 0}
                title="Հետ · վերջին կետ (Ctrl+Z)"
                aria-label="Հետ վերջին կետ"
              >
                <UndoPointIcon />
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center border border-[var(--mp-line)] px-2.5 py-1.5"
                onClick={clearDraft}
                title="Չեղարկել բոլոր կետերը"
                aria-label="Չեղարկել բոլոր կետերը"
              >
                <ClearPointsIcon />
              </button>
            </>
          ) : null}
        </div>

        {draftPoints.length > 0 && mode === "draw-polygon" ? (
          <p className="text-xs text-amber-800">
            Գիծը հետևում է cursor-ին։ Կտտացրու կետեր ավելացնելու համար · ✓ /
            Enter՝ պահպանել
            {toolPreset === "floors" ? " (փոխարինում է հին գծագիրը)" : ""}։
          </p>
        ) : null}
        {draftPoints.length > 0 && mode === "edit-polygon" ? (
          <p className="text-xs text-amber-800">
            Եզրի կետը քաշիր՝ գիծը կլորացնելու համար (գիծը մնում է cursor-ի
            տակ)։ Alt+click՝ ուղղել։ ✓ / Enter՝ պահպանել։
          </p>
        ) : null}
        {draftPoints.length > 0 &&
        (mode === "draw-band" || mode === "auto-stack") ? (
          <p className="text-xs text-amber-800">
            {mode === "draw-band"
              ? `Գոտի · ${draftPoints.length}/3 կտտոց`
              : `Ավտո · ${draftPoints.length}/4 կտտոց`}
          </p>
        ) : null}

        <div
          ref={viewportRef}
          className="relative h-[min(70dvh,720px)] w-full cursor-crosshair touch-none select-none overflow-hidden border border-[var(--mp-line)] bg-[var(--mp-stage)]"
          onClick={onCanvasClick}
          onDragStart={(event) => event.preventDefault()}
          onPointerMove={(event) => {
            if (
              mode !== "draw-polygon" &&
              mode !== "draw-band" &&
              mode !== "auto-stack"
            ) {
              if (cursorPoint) setCursorPoint(null);
              return;
            }
            const point = readNormalized(event, { clamp: true });
            setCursorPoint(point);
          }}
          onPointerLeave={() => setCursorPoint(null)}
        >
          <div
            className="absolute select-none"
            style={{
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
            }}
            onDragStart={(event) => event.preventDefault()}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Mapping canvas"
              width={imageWidth}
              height={imageHeight}
              draggable={false}
              onDragStart={(event) => event.preventDefault()}
              className="pointer-events-none h-full w-full object-fill select-none [-webkit-user-drag:none]"
            />
            {/* Catch empty-area pointer hits so the browser never starts native image drag. */}
            <div
              aria-hidden
              className="absolute inset-0 z-[1]"
              onDragStart={(event) => event.preventDefault()}
            />
            <svg
              className="pointer-events-none absolute inset-0 z-[2] h-full w-full"
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              preserveAspectRatio="none"
            >
              {entities.map((entity) =>
                entity.svgPath &&
                !(mode === "edit-polygon" && entity.id === selectedId) ? (
                  <path
                    key={`poly-${entity.id}`}
                    d={entity.svgPath}
                    fill={
                      entity.id === selectedId
                        ? "rgba(232,140,72,0.32)"
                        : "rgba(232,140,72,0.16)"
                    }
                    stroke={entity.id === selectedId ? "#c45c26" : "#d4894a"}
                    strokeWidth={entity.id === selectedId ? 3 : 1.5}
                  />
                ) : null,
              )}
              {draftPoints.length > 0 ? (
                mode === "edit-polygon" && editShape ? (
                  <path
                    d={polygonShapeToSvgPath(
                      editShape,
                      viewBoxWidth,
                      viewBoxHeight,
                    )}
                    fill="rgba(232,140,72,0.28)"
                    stroke="#c45c26"
                    strokeWidth="3"
                  />
                ) : (
                  <polyline
                    points={draftPoints
                      .map(
                        (point) =>
                          `${point.x * viewBoxWidth},${point.y * viewBoxHeight}`,
                      )
                      .join(" ")}
                    fill="none"
                    stroke="#c45c26"
                    strokeWidth="3"
                    strokeDasharray="8 6"
                  />
                )
              ) : null}
              {cursorPoint &&
              draftPoints.length > 0 &&
              (mode === "draw-polygon" ||
                mode === "draw-band" ||
                mode === "auto-stack") ? (
                <line
                  x1={draftPoints[draftPoints.length - 1]!.x * viewBoxWidth}
                  y1={draftPoints[draftPoints.length - 1]!.y * viewBoxHeight}
                  x2={cursorPoint.x * viewBoxWidth}
                  y2={cursorPoint.y * viewBoxHeight}
                  stroke="#c45c26"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                  opacity="0.9"
                />
              ) : null}
              {bandPreview ? (
                <polygon
                  points={bandPreview
                    .map(
                      (point) =>
                        `${point.x * viewBoxWidth},${point.y * viewBoxHeight}`,
                    )
                    .join(" ")}
                  fill="rgba(232,140,72,0.25)"
                  stroke="#c45c26"
                  strokeWidth="2"
                />
              ) : null}
            </svg>

            {mode === "edit-polygon" && editShape && editShape.vertices.length > 0 ? (
              <PolygonEditHandles
                shape={editShape}
                onChangeShape={replaceEditShape}
                readNormalized={(event) =>
                  readNormalized(event, { clamp: false })
                }
              />
            ) : null}

            {entities.map((entity) => {
              if (mode === "edit-polygon" && entity.id !== selectedId) {
                return null;
              }
              const editingSelected =
                mode === "edit-polygon" && entity.id === selectedId;
              return (
              <button
                key={`marker-${entity.id}`}
                type="button"
                className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white font-semibold tracking-wide text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${
                  editingSelected
                    ? "h-3.5 w-3.5 text-[8px] opacity-70"
                    : "h-5 w-5 text-[10px]"
                } ${
                  isDrawingMode ? "pointer-events-none" : ""
                } ${
                  entity.id === selectedId
                    ? "bg-[#d56a20] ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
                    : "bg-[#e07a2f]"
                }`}
                style={{
                  left: `${entity.markerX * 100}%`,
                  top: `${entity.markerY * 100}%`,
                }}
                onClick={(event) => {
                  event.stopPropagation();
                  onSelect(entity.id);
                }}
                onPointerDown={(event) => onMarkerPointerDown(event, entity.id)}
                onPointerMove={onMarkerPointerMove}
                onPointerUp={onMarkerPointerUp}
              >
                {formatMarkerLabel(entity.label)}
              </button>
              );
            })}
          </div>
        </div>

        <p className="text-xs text-[var(--mp-ink-muted)]">{hintText}</p>
      </div>
    );
  },
);
