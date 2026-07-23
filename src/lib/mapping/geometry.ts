import {
  clampNormalized,
  isValidNormalizedPoint,
  type NormalizedPoint,
} from "@/lib/coordinates";
import type { RegionPointsPayload } from "@/lib/mapping/types";
import { createEmptyPointsPayload } from "@/lib/mapping/types";

const CLOSE_EPSILON = 0.012;

export function uniquePoints(points: NormalizedPoint[]): NormalizedPoint[] {
  const result: NormalizedPoint[] = [];
  for (const point of points) {
    const last = result[result.length - 1];
    if (
      last &&
      Math.abs(last.x - point.x) < 1e-9 &&
      Math.abs(last.y - point.y) < 1e-9
    ) {
      continue;
    }
    result.push(point);
  }
  return result;
}

export function clampPoint(point: NormalizedPoint): NormalizedPoint {
  return {
    x: clampNormalized(point.x),
    y: clampNormalized(point.y),
  };
}

export function isNearPoint(
  a: NormalizedPoint,
  b: NormalizedPoint,
  epsilon = CLOSE_EPSILON,
): boolean {
  const dx = a.x - b.x;
  const dy = a.y - b.y;
  return Math.hypot(dx, dy) <= epsilon;
}

export function canClosePolygon(points: NormalizedPoint[]): boolean {
  return uniquePoints(points).length >= 3;
}

export function closePolygon(points: NormalizedPoint[]): RegionPointsPayload {
  const cleaned = uniquePoints(points).map(clampPoint);
  if (cleaned.length < 3) {
    throw new Error("Polygon requires at least 3 unique points");
  }
  return createEmptyPointsPayload(cleaned, true);
}

export function validateRegionPoints(payload: RegionPointsPayload): string[] {
  const errors: string[] = [];
  if (payload.coordinateSystem !== "NORMALIZED") {
    errors.push("coordinateSystem must be NORMALIZED");
  }
  if (payload.version !== 1) {
    errors.push("unsupported points version");
  }
  const cleaned = uniquePoints(payload.points);
  if (cleaned.length < 3) {
    errors.push("polygon needs at least 3 unique points");
  }
  for (const point of cleaned) {
    if (!isValidNormalizedPoint(point)) {
      errors.push("point out of [0,1] bounds");
      break;
    }
  }
  if (!payload.closed) {
    errors.push("polygon must be closed before save");
  }
  return errors;
}

/** Cross product helper for segment intersection. */
function orient(
  a: NormalizedPoint,
  b: NormalizedPoint,
  c: NormalizedPoint,
): number {
  return (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
}

function segmentsIntersect(
  a1: NormalizedPoint,
  a2: NormalizedPoint,
  b1: NormalizedPoint,
  b2: NormalizedPoint,
): boolean {
  const o1 = orient(a1, a2, b1);
  const o2 = orient(a1, a2, b2);
  const o3 = orient(b1, b2, a1);
  const o4 = orient(b1, b2, a2);
  return o1 * o2 < 0 && o3 * o4 < 0;
}

export function isSelfIntersecting(points: NormalizedPoint[]): boolean {
  const pts = uniquePoints(points);
  if (pts.length < 4) return false;
  const n = pts.length;
  for (let i = 0; i < n; i += 1) {
    const a1 = pts[i]!;
    const a2 = pts[(i + 1) % n]!;
    for (let j = i + 1; j < n; j += 1) {
      if (Math.abs(i - j) <= 1) continue;
      if (i === 0 && j === n - 1) continue;
      const b1 = pts[j]!;
      const b2 = pts[(j + 1) % n]!;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export function rectangleToPoints(
  a: NormalizedPoint,
  b: NormalizedPoint,
): NormalizedPoint[] {
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return [
    { x: minX, y: minY },
    { x: maxX, y: minY },
    { x: maxX, y: maxY },
    { x: minX, y: maxY },
  ].map(clampPoint);
}

export function pointsToSvgPath(
  points: NormalizedPoint[],
  closed: boolean,
): string {
  if (points.length === 0) return "";
  const [first, ...rest] = points;
  let d = `M ${first!.x} ${first!.y}`;
  for (const point of rest) {
    d += ` L ${point.x} ${point.y}`;
  }
  if (closed) d += " Z";
  return d;
}
