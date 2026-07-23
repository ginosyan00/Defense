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
  normalizedPointsToSvgPath,
  pointerToNormalized,
  svgPathToNormalizedPoints,
} from "@/lib/admin/mapping-math";
import { getContainedImageBounds } from "@/lib/coordinates";

export type MappingEntity = {
  id: string;
  label: string;
  title: string;
  markerX: number;
  markerY: number;
  svgPath: string | null;
};

export type MappingCanvasHandle = {
  /** Closes open draft (≥3 points) and persists via onPolygonClosed. */
  flushPolygonDraft: () => boolean;
  hasOpenDraft: () => boolean;
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
    const [bounds, setBounds] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const dragRef = useRef<{ id: string } | null>(null);
    const draftRef = useRef(draftPoints);
    const selectedIdRef = useRef(selectedId);
    useEffect(() => {
      draftRef.current = draftPoints;
    }, [draftPoints]);
    useEffect(() => {
      selectedIdRef.current = selectedId;
    }, [selectedId]);

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
        if (points.length < 3) return false;
        const svgPath = normalizedPointsToSvgPath(
          points,
          viewBoxWidth,
          viewBoxHeight,
        );
        if (!svgPath) return false;
        onChangeEntity(entityId, { svgPath });
        onPolygonClosed?.(entityId, svgPath);
        setDraftPoints([]);
        setMode("select");
        return true;
      },
      [onChangeEntity, onPolygonClosed, viewBoxHeight, viewBoxWidth],
    );

    const closePolygon = useCallback(() => {
      const entityId = selectedIdRef.current;
      if (!entityId) return;
      commitDraft(draftRef.current, entityId);
    }, [commitDraft]);

    /** Commit (≥3) or ask before discarding incomplete draft. Returns false if cancelled. */
    const resolveOpenDraft = useCallback(() => {
      const draft = draftRef.current;
      if (draft.length === 0) return true;
      if (draft.length >= 3) {
        const entityId = selectedIdRef.current;
        if (!entityId) return false;
        return commitDraft(draft, entityId);
      }
      if (
        !window.confirm(
          "Չպահպանված draft կա (<3 կետ)։ Չեղարկե՞լ և շարունակել։",
        )
      ) {
        return false;
      }
      setDraftPoints([]);
      return true;
    }, [commitDraft]);

    const changeMode = useCallback(
      (next: EditorMode) => {
        if (next === mode) return;
        if (!resolveOpenDraft()) return;
        setMode(next);
      },
      [mode, resolveOpenDraft],
    );

    useImperativeHandle(
      ref,
      () => ({
        flushPolygonDraft: () => {
          const entityId = selectedIdRef.current;
          if (!entityId) return false;
          return commitDraft(draftRef.current, entityId);
        },
        hasOpenDraft: () => draftRef.current.length > 0,
      }),
      [commitDraft],
    );

    useEffect(() => {
      const onKeyDown = (event: KeyboardEvent) => {
        if (event.key === "Enter" && draftRef.current.length >= 3) {
          event.preventDefault();
          closePolygon();
        }
        if (event.key === "Escape") {
          setDraftPoints([]);
          setMode("select");
        }
      };
      window.addEventListener("keydown", onKeyDown);
      return () => window.removeEventListener("keydown", onKeyDown);
    }, [closePolygon]);

    const onCanvasClick = (event: ReactMouseEvent<HTMLDivElement>) => {
      if (dragRef.current) return;
      const point = readNormalized(event);
      if (!point || !selectedId) return;

      if (mode === "place-marker") {
        onChangeEntity(selectedId, { markerX: point.x, markerY: point.y });
        return;
      }

      if (mode === "draw-polygon") {
        setDraftPoints((prev) => [...prev, point]);
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
      setDraftPoints([]);
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
      setDraftPoints([]);
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
              ["select", "Ընտրել"],
              ["place-marker", "Marker"],
              ["draw-polygon", "Polygon"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              className={`border px-3 py-1.5 text-xs uppercase tracking-[0.14em] ${
                mode === value
                  ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                  : "border-[var(--mp-line)]"
              }`}
              onClick={() => changeMode(value)}
            >
              {label}
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
                  setMode("draw-polygon");
                  setDraftPoints(
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
                className="border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-40"
                onClick={closePolygon}
                disabled={draftPoints.length < 3}
              >
                Պահպանել գծագիրը ({draftPoints.length} կետ)
              </button>
              <button
                type="button"
                className="border border-[var(--mp-line)] px-3 py-1.5 text-xs uppercase tracking-[0.14em]"
                onClick={() => setDraftPoints([])}
              >
                Չեղարկել կետերը
              </button>
            </>
          ) : null}
        </div>

        {draftPoints.length > 0 && draftPoints.length < 3 ? (
          <p className="text-xs text-amber-800">
            Draft է — դեռ չի պահպանվել։ Ավելացրու առնվազն {3 - draftPoints.length}{" "}
            կետ և սեղմիր «Պահպանել գծագիրը» (կամ Enter)։
          </p>
        ) : null}
        {draftPoints.length >= 3 ? (
          <p className="text-xs text-amber-800">
            Draft պատրաստ է։ Պարտադիր սեղմիր «Պահպանել գծագիրը» կամ Enter —
            այլապես refresh-ից հետո կանհետանա։
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
                        ? "rgba(214,190,140,0.35)"
                        : "rgba(214,190,140,0.12)"
                    }
                    stroke={entity.id === selectedId ? "#8a7348" : "#6d675c"}
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
              {draftPoints.map((point, index) => (
                <circle
                  key={`draft-pt-${index}`}
                  cx={point.x * viewBoxWidth}
                  cy={point.y * viewBoxHeight}
                  r={6}
                  fill="#c45c26"
                />
              ))}
            </svg>

            {entities.map((entity) => (
              <button
                key={`marker-${entity.id}`}
                type="button"
                className={`absolute z-10 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-xs shadow ${
                  entity.id === selectedId
                    ? "border-[var(--mp-focus)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                    : "border-[var(--mp-marker-border)] bg-[var(--mp-marker)]"
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
                {entity.label}
              </button>
            ))}
          </div>
        </div>

        <p className="text-xs text-[var(--mp-ink-muted)]">
          Նարնջագույն գիծը draft է (չպահպանված)։ Լցված տարածքը՝ պահպանված
          polygon։ Գծիր → «Պահպանել գծագիրը» / Enter։
        </p>
      </div>
    );
  },
);
