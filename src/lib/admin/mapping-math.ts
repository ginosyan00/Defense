import {
  getContainedImageBounds,
  clampNormalized,
  type Size,
} from "@/lib/coordinates";
import {
  mapShapePoints,
  polygonShapeToSvgPath,
  svgPathToPolygonShape,
} from "@/lib/admin/curved-polygon";

export type NormPoint = { x: number; y: number };

/**
 * Convert a pointer position inside a viewport element to normalized 0–1
 * coordinates relative to the object-fit:contain content box.
 */
export function pointerToNormalized(
  pointer: { clientX: number; clientY: number },
  viewportRect: { left: number; top: number; width: number; height: number },
  image: Size,
  options?: { clamp?: boolean },
): NormPoint | null {
  const localX = pointer.clientX - viewportRect.left;
  const localY = pointer.clientY - viewportRect.top;
  const bounds = getContainedImageBounds(
    { width: viewportRect.width, height: viewportRect.height },
    image,
  );

  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const x = (localX - bounds.x) / bounds.width;
  const y = (localY - bounds.y) / bounds.height;
  const shouldClamp = options?.clamp !== false;

  if (!shouldClamp) {
    return { x, y };
  }

  if (x < 0 || x > 1 || y < 0 || y > 1) {
    return {
      x: clampNormalized(x),
      y: clampNormalized(y),
    };
  }

  return { x, y };
}

/** Convert normalized point list to SVG path `d` in viewBox pixel space. */
export function normalizedPointsToSvgPath(
  points: Array<NormPoint>,
  viewBoxWidth: number,
  viewBoxHeight: number,
): string {
  if (points.length < 1) return "";
  const commands = points.map((point, index) => {
    const px = point.x * viewBoxWidth;
    const py = point.y * viewBoxHeight;
    return `${index === 0 ? "M" : "L"} ${px.toFixed(2)} ${py.toFixed(2)}`;
  });
  // Close only for real polygons; 1–2 points stay as open path / point.
  if (points.length >= 3) {
    return `${commands.join(" ")} Z`;
  }
  return commands.join(" ");
}

/** Append a new path segment without removing previous subpaths. */
export function appendSvgPaths(
  existingPath: string | null | undefined,
  nextSegment: string,
): string {
  const next = nextSegment.trim();
  if (!next) return existingPath?.trim() ?? "";
  const existing = existingPath?.trim() ?? "";
  if (!existing) return next;
  return `${existing} ${next}`;
}

/** Parse simple M/L ... Z path into normalized points. */
export function svgPathToNormalizedPoints(
  path: string,
  viewBoxWidth: number,
  viewBoxHeight: number,
): Array<NormPoint> {
  if (!path.trim() || viewBoxWidth <= 0 || viewBoxHeight <= 0) return [];
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const points: Array<NormPoint> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push({
      x: clampNormalized(nums[i]! / viewBoxWidth),
      y: clampNormalized(nums[i + 1]! / viewBoxHeight),
    });
  }
  return points;
}

export function lerpPoint(a: NormPoint, b: NormPoint, t: number): NormPoint {
  return {
    x: a.x + (b.x - a.x) * t,
    y: a.y + (b.y - a.y) * t,
  };
}

/**
 * 3-click band: top-left, top-right, then a point on the bottom edge
 * (Y = thickness, X = optional horizontal shift of the bottom edge).
 */
export function bandPolygonFromEdge(
  topLeft: NormPoint,
  topRight: NormPoint,
  bottomGuide: NormPoint,
): NormPoint[] {
  const midTop = {
    x: (topLeft.x + topRight.x) / 2,
    y: (topLeft.y + topRight.y) / 2,
  };
  const dy = bottomGuide.y - midTop.y;
  const dx = bottomGuide.x - midTop.x;
  const bottomLeft = {
    x: clampNormalized(topLeft.x + dx),
    y: clampNormalized(topLeft.y + dy),
  };
  const bottomRight = {
    x: clampNormalized(topRight.x + dx),
    y: clampNormalized(topRight.y + dy),
  };
  return [topLeft, topRight, bottomRight, bottomLeft];
}

/**
 * Slice a facade quad into `count` horizontal bands.
 * Index 0 = top of facade, index count-1 = bottom.
 */
export function stackBandsFromQuad(
  topLeft: NormPoint,
  topRight: NormPoint,
  bottomRight: NormPoint,
  bottomLeft: NormPoint,
  count: number,
): NormPoint[][] {
  const safeCount = Math.max(1, Math.floor(count));
  const bands: NormPoint[][] = [];
  for (let i = 0; i < safeCount; i += 1) {
    const t0 = i / safeCount;
    const t1 = (i + 1) / safeCount;
    bands.push([
      lerpPoint(topLeft, bottomLeft, t0),
      lerpPoint(topRight, bottomRight, t0),
      lerpPoint(topRight, bottomRight, t1),
      lerpPoint(topLeft, bottomLeft, t1),
    ]);
  }
  return bands;
}

export function pathCentroid(points: Array<NormPoint>): NormPoint {
  if (points.length === 0) return { x: 0.5, y: 0.5 };
  const sum = points.reduce(
    (acc, point) => ({ x: acc.x + point.x, y: acc.y + point.y }),
    { x: 0, y: 0 },
  );
  return { x: sum.x / points.length, y: sum.y / points.length };
}

export function estimatePathHeight(points: Array<NormPoint>): number {
  if (points.length === 0) return 0.04;
  let minY = points[0]!.y;
  let maxY = points[0]!.y;
  for (const point of points) {
    minY = Math.min(minY, point.y);
    maxY = Math.max(maxY, point.y);
  }
  return Math.max(0.012, maxY - minY);
}

export function offsetNormalizedPath(
  path: string,
  dx: number,
  dy: number,
  viewBoxWidth: number,
  viewBoxHeight: number,
): string {
  const shape = svgPathToPolygonShape(path, viewBoxWidth, viewBoxHeight);
  if (shape.vertices.length === 0) return path;
  const moved = mapShapePoints(shape, (point) => ({
    x: clampNormalized(point.x + dx),
    y: clampNormalized(point.y + dy),
  }));
  return polygonShapeToSvgPath(moved, viewBoxWidth, viewBoxHeight);
}
