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
  normalizedPointsToSvgPath,
  pointerToNormalized,
  svgPathToNormalizedPoints,
} from "@/lib/admin/mapping-math";
import { getContainedImageBounds } from "@/lib/coordinates";
import { formatMarkerLabel } from "@/lib/format-marker-label";
import {
  ClearPointsIcon,
  MarkerPinIcon,
  PolygonShapeIcon,
  SaveCheckIcon,
  SelectCursorIcon,
  TrashPointIcon,
  UndoPointIcon,
} from "@/components/admin/MappingToolbarIcons";

export type MappingEntity = {
  id: string;
  label: string;
  title: string;
  markerX: number;
  markerY: number;
  svgPath: string | null;
};

export type MappingCanvasHandle = {
  /** Commits open draft (≥1 point). Returns saved svgPath, or null if nothing to save. */
  flushPolygonDraft: () => string | null;
  hasOpenDraft: () => boolean;
  getDraftPointCount: () => number;
};

type EditorMode = "select" | "place-marker" | "draw-polygon";

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
    patch: Partial<Pick<MappingEntity, "markerX" | "markerY" | "svgPath">>,
  ) => void;
  onPolygonClosed?: (id: string, svgPath: string) => void;
  onPolygonDeleted?: (id: string) => void;
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
    },
    ref,
  ) {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [mode, setMode] = useState<EditorMode>("select");
    const [draftPoints, setDraftPoints] = useState<
      Array<{ x: number; y: number }>
    >([]);
    const [selectedDraftIndex, setSelectedDraftIndex] = useState<number | null>(
      null,
    );
    const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const dragRef = useRef<{ id: string } | null>(null);
    const draftRef = useRef(draftPoints);
    const selectedDraftIndexRef = useRef(selectedDraftIndex);
    const selectedIdRef = useRef(selectedId);
    const entitiesRef = useRef(entities);
    const replaceOnCommitRef = useRef(false);
    useEffect(() => {
      draftRef.current = draftPoints;
    }, [draftPoints]);
    useEffect(() => {
      selectedDraftIndexRef.current = selectedDraftIndex;
    }, [selectedDraftIndex]);
    useEffect(() => {
      selectedIdRef.current = selectedId;
    }, [selectedId]);
    useEffect(() => {
      entitiesRef.current = entities;
    }, [entities]);

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

    const readNormalized = (event: {
      clientX: number;
      clientY: number;
    }) => {
      const el = viewportRef.current;
      if (!el) return null;
      const rect = el.getBoundingClientRect();
      return pointerToNormalized(
        { clientX: event.clientX, clientY: event.clientY },
        rect,
        { width: imageWidth, height: imageHeight },
      );
    };

    const commitDraft = useCallback(
      (points: Array<{ x: number; y: number }>, entityId: string) => {
        if (points.length < 1) return null;
        const nextSegment = normalizedPointsToSvgPath(
          points,
          viewBoxWidth,
          viewBoxHeight,
        );
        if (!nextSegment) return null;

        const existing =
          entitiesRef.current.find((entity) => entity.id === entityId)
            ?.svgPath ?? null;
        const shouldReplace = replaceOnCommitRef.current || !existing;
        const svgPath = shouldReplace
          ? nextSegment
          : appendSvgPaths(existing, nextSegment);
        replaceOnCommitRef.current = false;

        onChangeEntity(entityId, { svgPath });
        onPolygonClosed?.(entityId, svgPath);
        // Clear draft so the next stroke starts from a new click (not last point).
        draftRef.current = [];
        setDraftPoints([]);
        setSelectedDraftIndex(null);
        setMode("draw-polygon");
        return svgPath;
      },
      [onChangeEntity, onPolygonClosed, viewBoxHeight, viewBoxWidth],
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
      setDraftPoints([]);
      setSelectedDraftIndex(null);
    }, []);

    const replaceDraftPoints = useCallback(
      (next: Array<{ x: number; y: number }>) => {
        draftRef.current = next;
        setDraftPoints(next);
      },
      [],
    );

    const updateDraftPoints = useCallback(
      (
        updater: (
          prev: Array<{ x: number; y: number }>,
        ) => Array<{ x: number; y: number }>,
      ) => {
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

    /** Commit open draft when leaving tools. Returns false if cancelled. */
    const resolveOpenDraft = useCallback(() => {
      const draft = draftRef.current;
      if (draft.length === 0) return true;
      const entityId = selectedIdRef.current;
      if (!entityId) return false;
      return commitDraft(draft, entityId) != null;
    }, [commitDraft]);

    const changeMode = useCallback(
      (next: EditorMode) => {
        if (next === mode) return;
        if (!resolveOpenDraft()) return;
        setMode(next);
        // Entering polygon mode starts a fresh stroke (saved shape stays visible).
        if (next === "draw-polygon") {
          replaceOnCommitRef.current = false;
          clearDraft();
        }
      },
      [clearDraft, mode, resolveOpenDraft],
    );

    useImperativeHandle(
      ref,
      () => ({
        flushPolygonDraft: () => {
          const entityId = selectedIdRef.current;
          if (!entityId) return null;
          return commitDraft(draftRef.current, entityId);
        },
        hasOpenDraft: () => draftRef.current.length > 0,
        getDraftPointCount: () => draftRef.current.length,
      }),
      [commitDraft],
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

        if (event.key === "Enter" && draftRef.current.length >= 1) {
          event.preventDefault();
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
      undoLastDraftPoint,
    ]);

    const onCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (dragRef.current) return;
      const point = readNormalized(event);
      if (!point || !selectedId) return;

      if (mode === "place-marker") {
        onChangeEntity(selectedId, { markerX: point.x, markerY: point.y });
        return;
      }

      if (mode === "draw-polygon") {
        // Always add the click as a new vertex — self-crossing / overlapping
        // points are allowed. Alt+click near an existing point selects it.
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

    return (
      <div className="space-y-3">
        <div
          className="flex flex-wrap gap-2"
          role="toolbar"
          aria-label="Mapping tools"
        >
          {(
            [
              ["select", "Ընտրել", SelectCursorIcon],
              ["place-marker", "Marker", MarkerPinIcon],
              ["draw-polygon", "Polygon", PolygonShapeIcon],
            ] as const
          ).map(([value, label, Icon]) => (
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
                  setMode("draw-polygon");
                  setSelectedDraftIndex(null);
                  replaceDraftPoints(
                    svgPathToNormalizedPoints(
                      selected.svgPath,
                      viewBoxWidth,
                      viewBoxHeight,
                    ),
                  );
                }}
              >
                Խմբագրել polygon
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
          {mode === "draw-polygon" || draftPoints.length > 0 ? (
            <>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-2.5 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-40"
                onClick={closePolygon}
                disabled={draftPoints.length < 1}
                title={`Պահպանել գծագիրը (${draftPoints.length} կետ)`}
                aria-label={`Պահպանել գծագիրը, ${draftPoints.length} կետ`}
              >
                <SaveCheckIcon />
                <span>{draftPoints.length}</span>
              </button>
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

        {draftPoints.length > 0 ? (
          <p className="text-xs text-amber-800">
            Draft է ({draftPoints.length} կետ)։ Save-ից հետո կարող ես
            շարունակել նույն գծագիրը — հին կետերը չեն կորչում։ ✓ / Enter՝
            պահպանել։
          </p>
        ) : null}

        <div
          ref={viewportRef}
          className="relative h-[min(70dvh,720px)] w-full cursor-crosshair overflow-hidden border border-[var(--mp-line)] bg-[var(--mp-stage)]"
          onClick={onCanvasClick}
        >
          <div
            className="absolute"
            style={{
              left: bounds.x,
              top: bounds.y,
              width: bounds.width,
              height: bounds.height,
            }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imageUrl}
              alt="Mapping canvas"
              width={imageWidth}
              height={imageHeight}
              draggable={false}
              className="h-full w-full object-fill select-none"
            />
            <svg
              className="pointer-events-none absolute inset-0 h-full w-full"
              viewBox={`0 0 ${viewBoxWidth} ${viewBoxHeight}`}
              preserveAspectRatio="none"
            >
              {entities.map((entity) =>
                entity.svgPath ? (
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
              ) : null}
            </svg>

            {entities.map((entity) => (
              <button
                key={`marker-${entity.id}`}
                type="button"
                className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold tracking-wide text-white shadow-[0_3px_10px_rgba(0,0,0,0.35)] ${
                  mode === "place-marker" || mode === "draw-polygon"
                    ? "pointer-events-none"
                    : ""
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
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--mp-ink-muted)]">
          Save-ից հետո հաջորդ կտտոցը սկսում է նոր գիծ (հինը մնում է)։ Նոր
          Save-ը միավորում է գծերը։ Ամբողջությամբ փոխելու համար՝ «Խմբագրել» կամ
          «Նոր polygon»։
        </p>
      </div>
    );
  },
);
