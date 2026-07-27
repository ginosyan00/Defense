import { clampNormalized } from "@/lib/coordinates";
import type { NormPoint } from "@/lib/admin/mapping-math";

export type PointBounds = {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
};

export function boundsOfPoints(points: NormPoint[]): PointBounds | null {
  if (points.length === 0) return null;
  let minX = points[0]!.x;
  let maxX = points[0]!.x;
  let minY = points[0]!.y;
  let maxY = points[0]!.y;
  for (const point of points) {
    minX = Math.min(minX, point.x);
    maxX = Math.max(maxX, point.x);
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  return { minX, minY, maxX, maxY };
}

export function movePoints(
  points: NormPoint[],
  dx: number,
  dy: number,
): NormPoint[] {
  return points.map((point) => ({
    x: clampNormalized(point.x + dx),
    y: clampNormalized(point.y + dy),
  }));
}

export function scalePointsAbout(
  points: NormPoint[],
  anchor: NormPoint,
  scaleX: number,
  scaleY: number,
): NormPoint[] {
  const sx = Number.isFinite(scaleX) && Math.abs(scaleX) > 0.05 ? scaleX : 1;
  const sy = Number.isFinite(scaleY) && Math.abs(scaleY) > 0.05 ? scaleY : 1;
  return points.map((point) => ({
    x: clampNormalized(anchor.x + (point.x - anchor.x) * sx),
    y: clampNormalized(anchor.y + (point.y - anchor.y) * sy),
  }));
}

export function rotatePointsAbout(
  points: NormPoint[],
  center: NormPoint,
  radians: number,
): NormPoint[] {
  const cos = Math.cos(radians);
  const sin = Math.sin(radians);
  return points.map((point) => {
    const dx = point.x - center.x;
    const dy = point.y - center.y;
    return {
      x: clampNormalized(center.x + dx * cos - dy * sin),
      y: clampNormalized(center.y + dx * sin + dy * cos),
    };
  });
}

export function angleOf(point: NormPoint, center: NormPoint): number {
  return Math.atan2(point.y - center.y, point.x - center.x);
}

export type ScaleCorner = "tl" | "tr" | "br" | "bl";

export function cornerPoint(
  bounds: PointBounds,
  corner: ScaleCorner,
): NormPoint {
  switch (corner) {
    case "tl":
      return { x: bounds.minX, y: bounds.minY };
    case "tr":
      return { x: bounds.maxX, y: bounds.minY };
    case "br":
      return { x: bounds.maxX, y: bounds.maxY };
    case "bl":
      return { x: bounds.minX, y: bounds.maxY };
  }
}

export function oppositeCorner(corner: ScaleCorner): ScaleCorner {
  switch (corner) {
    case "tl":
      return "br";
    case "tr":
      return "bl";
    case "br":
      return "tl";
    case "bl":
      return "tr";
  }
}

export function edgeMidpoint(
  a: NormPoint,
  b: NormPoint,
): NormPoint {
  return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
}
