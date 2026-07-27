import { clampNormalized } from "@/lib/coordinates";
import type { NormPoint } from "@/lib/admin/mapping-math";
import { boundsOfPoints, type PointBounds } from "@/lib/admin/polygon-transform";

export type PolygonShape = {
  vertices: NormPoint[];
  /** Control point for edge i → next vertex; null = straight line. */
  curves: Array<NormPoint | null>;
};

export function shapeFromVertices(vertices: NormPoint[]): PolygonShape {
  return {
    vertices: vertices.map((point) => ({ ...point })),
    curves: vertices.map(() => null),
  };
}

export function allShapePoints(shape: PolygonShape): NormPoint[] {
  const points = [...shape.vertices];
  for (const curve of shape.curves) {
    if (curve) points.push(curve);
  }
  return points;
}

export function boundsOfShape(shape: PolygonShape): PointBounds | null {
  return boundsOfPoints(allShapePoints(shape));
}

export function mapShapePoints(
  shape: PolygonShape,
  mapPoint: (point: NormPoint) => NormPoint,
): PolygonShape {
  return {
    vertices: shape.vertices.map(mapPoint),
    curves: shape.curves.map((curve) => (curve ? mapPoint(curve) : null)),
  };
}

/** Point on quadratic Bezier at t∈[0,1]. */
export function quadraticAt(
  start: NormPoint,
  control: NormPoint,
  end: NormPoint,
  t: number,
): NormPoint {
  const mt = 1 - t;
  return {
    x: mt * mt * start.x + 2 * mt * t * control.x + t * t * end.x,
    y: mt * mt * start.y + 2 * mt * t * control.y + t * t * end.y,
  };
}

export function edgeHandlePosition(
  shape: PolygonShape,
  edgeIndex: number,
): NormPoint {
  const count = shape.vertices.length;
  const start = shape.vertices[edgeIndex]!;
  const end = shape.vertices[(edgeIndex + 1) % count]!;
  const curve = shape.curves[edgeIndex] ?? null;
  if (curve) return quadraticAt(start, curve, end, 0.5);
  return { x: (start.x + end.x) / 2, y: (start.y + end.y) / 2 };
}

export function polygonShapeToSvgPath(
  shape: PolygonShape,
  viewBoxWidth: number,
  viewBoxHeight: number,
): string {
  const { vertices, curves } = shape;
  if (vertices.length < 1) return "";
  const toPx = (point: NormPoint) =>
    `${(point.x * viewBoxWidth).toFixed(2)} ${(point.y * viewBoxHeight).toFixed(2)}`;

  const parts: string[] = [`M ${toPx(vertices[0]!)}`];
  const count = vertices.length;

  for (let i = 0; i < count - 1; i += 1) {
    const next = vertices[i + 1]!;
    const curve = curves[i] ?? null;
    if (curve) {
      parts.push(`Q ${toPx(curve)} ${toPx(next)}`);
    } else {
      parts.push(`L ${toPx(next)}`);
    }
  }

  if (count >= 3) {
    const closingCurve = curves[count - 1] ?? null;
    if (closingCurve) {
      parts.push(`Q ${toPx(closingCurve)} ${toPx(vertices[0]!)}`);
    }
    parts.push("Z");
  }

  return parts.join(" ");
}

/**
 * Parse M/L/Q/Z paths (absolute). Relative commands are normalized roughly.
 * Control points become curves[]; line segments keep null.
 */
export function svgPathToPolygonShape(
  path: string,
  viewBoxWidth: number,
  viewBoxHeight: number,
): PolygonShape {
  if (!path.trim() || viewBoxWidth <= 0 || viewBoxHeight <= 0) {
    return shapeFromVertices([]);
  }

  const tokens =
    path.match(/[MmLlQqZz]|-?\d*\.?\d+(?:e[-+]?\d+)?/g) ?? [];
  const vertices: NormPoint[] = [];
  const curves: Array<NormPoint | null> = [];

  let i = 0;
  let command = "";
  let current: NormPoint = { x: 0, y: 0 };
  let start: NormPoint = { x: 0, y: 0 };

  const readNumber = () => {
    const raw = tokens[i++];
    return raw != null ? Number(raw) : NaN;
  };

  const toNorm = (x: number, y: number, free = false): NormPoint => ({
    x: free ? x / viewBoxWidth : clampNormalized(x / viewBoxWidth),
    y: free ? y / viewBoxHeight : clampNormalized(y / viewBoxHeight),
  });

  while (i < tokens.length) {
    const token = tokens[i]!;
    if (/^[MmLlQqZz]$/.test(token)) {
      command = token;
      i += 1;
      if (command === "Z" || command === "z") {
        break;
      }
      continue;
    }

    if (!command) {
      i += 1;
      continue;
    }

    if (command === "M" || command === "m") {
      const x = readNumber();
      const y = readNumber();
      if (!Number.isFinite(x) || !Number.isFinite(y)) break;
      current =
        command === "m"
          ? toNorm(
              current.x * viewBoxWidth + x,
              current.y * viewBoxHeight + y,
            )
          : toNorm(x, y);
      start = current;
      vertices.push(current);
      // First point has no incoming edge yet.
      command = command === "m" ? "l" : "L";
      continue;
    }

    if (command === "L" || command === "l") {
      const x = readNumber();
      const y = readNumber();
      if (!Number.isFinite(x) || !Number.isFinite(y)) break;
      const next =
        command === "l"
          ? toNorm(
              current.x * viewBoxWidth + x,
              current.y * viewBoxHeight + y,
            )
          : toNorm(x, y);
      if (vertices.length > 0) {
        curves.push(null);
      }
      vertices.push(next);
      current = next;
      continue;
    }

    if (command === "Q" || command === "q") {
      const cx = readNumber();
      const cy = readNumber();
      const x = readNumber();
      const y = readNumber();
      if (
        !Number.isFinite(cx) ||
        !Number.isFinite(cy) ||
        !Number.isFinite(x) ||
        !Number.isFinite(y)
      ) {
        break;
      }
      const control =
        command === "q"
          ? toNorm(
              current.x * viewBoxWidth + cx,
              current.y * viewBoxHeight + cy,
              true,
            )
          : toNorm(cx, cy, true);
      const next =
        command === "q"
          ? toNorm(
              current.x * viewBoxWidth + x,
              current.y * viewBoxHeight + y,
            )
          : toNorm(x, y);
      if (vertices.length > 0) {
        curves.push(control);
      }
      vertices.push(next);
      current = next;
      continue;
    }

    i += 1;
  }

  // If last vertex equals start (duplicate close point), drop only the vertex.
  // Keep the last curve as the closing edge (v_last-1 → v0).
  if (vertices.length >= 2) {
    const last = vertices[vertices.length - 1]!;
    if (Math.hypot(last.x - start.x, last.y - start.y) < 1e-4) {
      vertices.pop();
    }
  }

  while (curves.length < vertices.length) {
    curves.push(null);
  }
  if (curves.length > vertices.length) {
    curves.length = vertices.length;
  }

  return { vertices, curves };
}

/** Set/update curve control for an edge by dragging handle position. */
export function bendEdgeToHandle(
  shape: PolygonShape,
  edgeIndex: number,
  handle: NormPoint,
): PolygonShape {
  const count = shape.vertices.length;
  if (count < 2) return shape;
  const i = ((edgeIndex % count) + count) % count;
  const start = shape.vertices[i]!;
  const end = shape.vertices[(i + 1) % count]!;
  // For quadratic Bezier, point at t=0.5 is:
  // mid = 0.25*start + 0.5*control + 0.25*end
  // => control = 2*mid - 0.5*start - 0.5*end
  const control = {
    x: 2 * handle.x - 0.5 * start.x - 0.5 * end.x,
    y: 2 * handle.y - 0.5 * start.y - 0.5 * end.y,
  };
  const curves = shape.curves.map((curve, index) =>
    index === i ? control : curve,
  );
  return { vertices: shape.vertices, curves };
}

export function straightenEdge(
  shape: PolygonShape,
  edgeIndex: number,
): PolygonShape {
  const count = shape.vertices.length;
  const i = ((edgeIndex % count) + count) % count;
  return {
    vertices: shape.vertices,
    curves: shape.curves.map((curve, index) => (index === i ? null : curve)),
  };
}
