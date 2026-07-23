"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { getContainedImageBounds } from "@/lib/coordinates";
import {
  canClosePolygon,
  closePolygon,
  isNearPoint,
} from "@/lib/mapping/geometry";
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
  type HistoryState,
} from "@/lib/mapping/history";
import {
  applyZoomAt,
  resetTransform,
  screenToNormalized,
} from "@/lib/mapping/transform";
import type {
  EditorRegion,
  EditorTool,
  ViewportTransform,
} from "@/lib/mapping/types";

function createRegionId(): string {
  return `region_${Math.random().toString(36).slice(2, 10)}`;
}

export function useMappingEditorState(
  imageWidth: number,
  imageHeight: number,
  initialRegions: EditorRegion[],
) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<HistoryState<EditorRegion[]>>(() =>
    createHistory(initialRegions),
  );
  const regions = history.present;
  const [selectedId, setSelectedId] = useState<string | null>(
    initialRegions[0]?.id ?? null,
  );
  const [tool, setTool] = useState<EditorTool>("select");
  const [draftPoints, setDraftPoints] = useState<
    Array<{ x: number; y: number }>
  >([]);
  const [transform, setTransform] = useState<ViewportTransform>(resetTransform);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });
  const panRef = useRef<{
    startX: number;
    startY: number;
    originTx: number;
    originTy: number;
  } | null>(null);
  const vertexDragRef = useRef<{
    regionId: string;
    index: number;
    before: EditorRegion[];
  } | null>(null);

  const bounds = useMemo(
    () =>
      getContainedImageBounds(viewportSize, {
        width: imageWidth,
        height: imageHeight,
      }),
    [viewportSize, imageWidth, imageHeight],
  );

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setViewportSize({ width: rect.width, height: rect.height });
  }, []);

  useEffect(() => {
    measure();
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  const commitRegions = useCallback((next: EditorRegion[]) => {
    setHistory((prev) => pushHistory(prev, next));
  }, []);

  const selected = regions.find((region) => region.id === selectedId) ?? null;

  const readPoint = useCallback(
    (event: { clientX: number; clientY: number }) => {
      const el = viewportRef.current;
      if (!el) return null;
      return screenToNormalized(
        event,
        el.getBoundingClientRect(),
        { width: imageWidth, height: imageHeight },
        transform,
      );
    },
    [imageHeight, imageWidth, transform],
  );

  const finishPolygon = useCallback(() => {
    if (!canClosePolygon(draftPoints)) return;
    const payload = closePolygon(draftPoints);
    const region: EditorRegion = {
      id: createRegionId(),
      title: `Region ${regions.length + 1}`,
      label: null,
      points: payload.points,
      closed: true,
      destinationType: "INFORMATION_ONLY",
      destinationEntityId: null,
      customUrl: null,
      status: "DRAFT",
    };
    commitRegions([...regions, region]);
    setSelectedId(region.id);
    setDraftPoints([]);
    setTool("select");
  }, [commitRegions, draftPoints, regions]);

  const onDelete = useCallback(() => {
    if (!selectedId) return;
    commitRegions(regions.filter((region) => region.id !== selectedId));
    setSelectedId(null);
  }, [commitRegions, regions, selectedId]);

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (tool === "pan" || event.button === 1) {
      panRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originTx: transform.tx,
        originTy: transform.ty,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    const target = event.target as HTMLElement;
    const vertexIndex = target.dataset.vertexIndex;
    const regionId = target.dataset.regionId;
    if (
      tool === "select" &&
      vertexIndex !== undefined &&
      regionId &&
      selectedId === regionId
    ) {
      vertexDragRef.current = {
        regionId,
        index: Number(vertexIndex),
        before: regions,
      };
      event.currentTarget.setPointerCapture(event.pointerId);
      return;
    }

    if (tool !== "draw-polygon") return;
    const point = readPoint(event);
    if (!point) return;
    if (draftPoints.length >= 3 && isNearPoint(point, draftPoints[0]!)) {
      finishPolygon();
      return;
    }
    setDraftPoints((prev) => [...prev, point]);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (panRef.current) {
      const dx = event.clientX - panRef.current.startX;
      const dy = event.clientY - panRef.current.startY;
      setTransform({
        ...transform,
        tx: panRef.current.originTx + dx,
        ty: panRef.current.originTy + dy,
      });
      return;
    }
    if (!vertexDragRef.current) return;
    const point = readPoint(event);
    if (!point) return;
    const { regionId, index } = vertexDragRef.current;
    setHistory((prev) => ({
      ...prev,
      present: prev.present.map((region) => {
        if (region.id !== regionId) return region;
        return {
          ...region,
          points: region.points.map((existing, i) =>
            i === index ? point : existing,
          ),
        };
      }),
    }));
  };

  const onPointerUp = () => {
    if (vertexDragRef.current) {
      const before = vertexDragRef.current.before;
      setHistory((prev) => ({
        past: [...prev.past, before].slice(-50),
        present: prev.present,
        future: [],
      }));
      vertexDragRef.current = null;
    }
    panRef.current = null;
  };

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "z") {
        event.preventDefault();
        setHistory((prev) =>
          event.shiftKey ? redoHistory(prev) : undoHistory(prev),
        );
        return;
      }
      if (event.key === "Enter" && tool === "draw-polygon") {
        event.preventDefault();
        finishPolygon();
        return;
      }
      if (event.key === "Escape") {
        setDraftPoints([]);
        if (tool === "draw-polygon") setTool("select");
        else setSelectedId(null);
        return;
      }
      if (
        (event.key === "Delete" || event.key === "Backspace") &&
        selectedId &&
        !(event.target instanceof HTMLInputElement) &&
        !(event.target instanceof HTMLTextAreaElement) &&
        !(event.target instanceof HTMLSelectElement)
      ) {
        event.preventDefault();
        onDelete();
      }
      if (event.key === "+" || event.key === "=") {
        setTransform((prev) => applyZoomAt(prev, 1.15));
      }
      if (event.key === "-" || event.key === "_") {
        setTransform((prev) => applyZoomAt(prev, 1 / 1.15));
      }
      if (event.key === "0") setTransform(resetTransform());
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [finishPolygon, onDelete, selectedId, tool]);

  const draftHint =
    tool === "draw-polygon"
      ? draftPoints.length < 3
        ? `Click to add points (${draftPoints.length}/3 min)`
        : "Enter or click first point to close"
      : null;

  return {
    bindViewport: (node: HTMLDivElement | null) => {
      viewportRef.current = node;
    },
    regions,
    history,
    selectedId,
    setSelectedId,
    tool,
    setTool,
    draftPoints,
    setDraftPoints,
    transform,
    setTransform,
    viewportSize,
    bounds,
    selected,
    draftHint,
    commitRegions,
    onDelete,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    canUndo: canUndo(history),
    canRedo: canRedo(history),
    undo: () => setHistory((prev) => undoHistory(prev)),
    redo: () => setHistory((prev) => redoHistory(prev)),
    zoomIn: () => setTransform((prev) => applyZoomAt(prev, 1.15)),
    zoomOut: () => setTransform((prev) => applyZoomAt(prev, 1 / 1.15)),
    resetView: () => setTransform(resetTransform()),
  };
}
