"use client";

import { useEffect, useRef } from "react";
import type { NormPoint } from "@/lib/admin/mapping-math";
import {
  bendEdgeToHandle,
  boundsOfShape,
  edgeHandlePosition,
  mapShapePoints,
  straightenEdge,
  type PolygonShape,
} from "@/lib/admin/curved-polygon";
import {
  angleOf,
  cornerPoint,
  oppositeCorner,
  rotatePointsAbout,
  scalePointsAbout,
  type ScaleCorner,
} from "@/lib/admin/polygon-transform";

type PolygonEditHandlesProps = {
  shape: PolygonShape;
  onChangeShape: (next: PolygonShape) => void;
  readNormalized: (event: {
    clientX: number;
    clientY: number;
  }) => NormPoint | null;
};

type DragState =
  | { kind: "vertex"; index: number }
  | { kind: "bend"; edgeIndex: number }
  | { kind: "move"; last: NormPoint }
  | {
      kind: "scale";
      corner: ScaleCorner;
      anchor: NormPoint;
      startShape: PolygonShape;
      startCorner: NormPoint;
    }
  | {
      kind: "rotate";
      center: NormPoint;
      startAngle: number;
      startShape: PolygonShape;
    };

const CORNERS: ScaleCorner[] = ["tl", "tr", "br", "bl"];

function transformShapePoints(
  shape: PolygonShape,
  transform: (points: NormPoint[]) => NormPoint[],
): PolygonShape {
  const curveIndexes: number[] = [];
  const packed: NormPoint[] = shape.vertices.map((point) => ({ ...point }));
  shape.curves.forEach((curve, index) => {
    if (!curve) return;
    curveIndexes.push(index);
    packed.push({ ...curve });
  });
  const next = transform(packed);
  const count = shape.vertices.length;
  const curves: Array<NormPoint | null> = shape.curves.map(() => null);
  curveIndexes.forEach((edgeIndex, offset) => {
    const point = next[count + offset];
    if (point) curves[edgeIndex] = { ...point };
  });
  return {
    vertices: next.slice(0, count).map((point) => ({ ...point })),
    curves,
  };
}

function cloneShape(shape: PolygonShape): PolygonShape {
  return {
    vertices: shape.vertices.map((item) => ({ ...item })),
    curves: shape.curves.map((curve) => (curve ? { ...curve } : null)),
  };
}

export function PolygonEditHandles({
  shape,
  onChangeShape,
  readNormalized,
}: PolygonEditHandlesProps) {
  const dragRef = useRef<DragState | null>(null);
  const shapeRef = useRef(shape);
  const onChangeRef = useRef(onChangeShape);
  const readRef = useRef(readNormalized);

  useEffect(() => {
    shapeRef.current = shape;
  }, [shape]);
  useEffect(() => {
    onChangeRef.current = onChangeShape;
  }, [onChangeShape]);
  useEffect(() => {
    readRef.current = readNormalized;
  }, [readNormalized]);

  useEffect(() => {
    const onPointerMove = (event: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      const point = readRef.current(event);
      if (!point) return;
      const current = shapeRef.current;

      if (drag.kind === "vertex") {
        onChangeRef.current({
          ...current,
          vertices: current.vertices.map((item, index) =>
            index === drag.index ? { x: point.x, y: point.y } : item,
          ),
        });
        return;
      }

      if (drag.kind === "bend") {
        // Curve midpoint stays under the cursor while dragging.
        onChangeRef.current(bendEdgeToHandle(current, drag.edgeIndex, point));
        return;
      }

      if (drag.kind === "move") {
        const dx = point.x - drag.last.x;
        const dy = point.y - drag.last.y;
        onChangeRef.current(
          mapShapePoints(current, (item) => ({
            x: item.x + dx,
            y: item.y + dy,
          })),
        );
        dragRef.current = { ...drag, last: point };
        return;
      }

      if (drag.kind === "scale") {
        const denomX = drag.startCorner.x - drag.anchor.x;
        const denomY = drag.startCorner.y - drag.anchor.y;
        let scaleX =
          Math.abs(denomX) < 1e-4 ? 1 : (point.x - drag.anchor.x) / denomX;
        let scaleY =
          Math.abs(denomY) < 1e-4 ? 1 : (point.y - drag.anchor.y) / denomY;
        if (event.shiftKey) {
          const uniform = (Math.abs(scaleX) + Math.abs(scaleY)) / 2;
          scaleX = Math.sign(scaleX || 1) * uniform;
          scaleY = Math.sign(scaleY || 1) * uniform;
        }
        onChangeRef.current(
          transformShapePoints(drag.startShape, (points) =>
            scalePointsAbout(points, drag.anchor, scaleX, scaleY),
          ),
        );
        return;
      }

      if (drag.kind === "rotate") {
        const nextAngle = angleOf(point, drag.center);
        onChangeRef.current(
          transformShapePoints(drag.startShape, (points) =>
            rotatePointsAbout(
              points,
              drag.center,
              nextAngle - drag.startAngle,
            ),
          ),
        );
      }
    };

    const onPointerUp = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  }, []);

  const bounds = boundsOfShape(shape);
  if (!bounds || shape.vertices.length === 0) return null;

  const center = {
    x: (bounds.minX + bounds.maxX) / 2,
    y: (bounds.minY + bounds.maxY) / 2,
  };
  const rotateHandle = {
    x: center.x,
    y: Math.max(0.02, bounds.minY - 0.035),
  };

  return (
    <>
      <button
        type="button"
        aria-label="Տեղաշարժել polygon"
        className="absolute z-[15] -translate-x-1/2 -translate-y-1/2 cursor-move rounded-full border border-white/80 bg-[#e07a2f]/70"
        style={{
          left: `${center.x * 100}%`,
          top: `${center.y * 100}%`,
          width: 10,
          height: 10,
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          const point = readNormalized(event);
          if (!point) return;
          dragRef.current = { kind: "move", last: point };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
      />

      <button
        type="button"
        aria-label="Պտտել polygon"
        title="Պտտել"
        className="absolute z-20 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#2f6fed] shadow-sm"
        style={{
          left: `${rotateHandle.x * 100}%`,
          top: `${rotateHandle.y * 100}%`,
          cursor: "grab",
        }}
        onPointerDown={(event) => {
          event.stopPropagation();
          event.preventDefault();
          const point = readNormalized(event);
          if (!point) return;
          const liveBounds = boundsOfShape(shapeRef.current);
          const liveCenter = liveBounds
            ? {
                x: (liveBounds.minX + liveBounds.maxX) / 2,
                y: (liveBounds.minY + liveBounds.maxY) / 2,
              }
            : center;
          dragRef.current = {
            kind: "rotate",
            center: liveCenter,
            startAngle: angleOf(point, liveCenter),
            startShape: cloneShape(shapeRef.current),
          };
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
      />

      {CORNERS.map((corner) => {
        const pos = cornerPoint(bounds, corner);
        const cursor =
          corner === "tl" || corner === "br" ? "nwse-resize" : "nesw-resize";
        return (
          <button
            key={corner}
            type="button"
            aria-label={`Մեծացնել/փոքրացնել ${corner}`}
            title="Քաշիր · Shift = համաչափ"
            className="absolute z-20 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-[1px] border border-white bg-[#c45c26] shadow-sm"
            style={{
              left: `${pos.x * 100}%`,
              top: `${pos.y * 100}%`,
              cursor,
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              const liveBounds = boundsOfShape(shapeRef.current);
              if (!liveBounds) return;
              dragRef.current = {
                kind: "scale",
                corner,
                anchor: cornerPoint(liveBounds, oppositeCorner(corner)),
                startShape: cloneShape(shapeRef.current),
                startCorner: cornerPoint(liveBounds, corner),
              };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          />
        );
      })}

      {shape.vertices.map((_, index) => {
        const handle = edgeHandlePosition(shape, index);
        const isCurved = Boolean(shape.curves[index]);
        return (
          <button
            key={`edge-${index}`}
            type="button"
            aria-label={
              isCurved ? `Կոր եզր ${index + 1}` : `Կլորացնել եզր ${index + 1}`
            }
            title={
              isCurved
                ? "Քաշիր՝ կորը cursor-ի հետ տանելու համար · Alt+click՝ ուղղել"
                : "Քաշիր՝ գիծը կլորացնելու համար (գիծը մնում է cursor-ի տակ)"
            }
            className={`absolute z-20 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white shadow-sm ${
              isCurved ? "bg-[#7c5cff]" : "bg-[#f0c28a]"
            }`}
            style={{
              left: `${handle.x * 100}%`,
              top: `${handle.y * 100}%`,
              cursor: "move",
            }}
            onPointerDown={(event) => {
              event.stopPropagation();
              event.preventDefault();
              if (event.altKey) {
                onChangeRef.current(straightenEdge(shapeRef.current, index));
                return;
              }
              dragRef.current = { kind: "bend", edgeIndex: index };
              event.currentTarget.setPointerCapture(event.pointerId);
            }}
          />
        );
      })}

      {shape.vertices.map((point, index) => (
        <button
          key={`vertex-${index}`}
          type="button"
          aria-label={`Կետ ${index + 1}`}
          title="Քաշիր կետը"
          className="absolute z-[22] h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white bg-[#c45c26] shadow-sm"
          style={{
            left: `${point.x * 100}%`,
            top: `${point.y * 100}%`,
            cursor: "grab",
          }}
          onPointerDown={(event) => {
            event.stopPropagation();
            event.preventDefault();
            dragRef.current = { kind: "vertex", index };
            event.currentTarget.setPointerCapture(event.pointerId);
          }}
        />
      ))}
    </>
  );
}
