import {
  getContainedImageBounds,
  clampNormalized,
  type Size,
} from "@/lib/coordinates";

/**
 * Convert a pointer position inside a viewport element to normalized 0–1
 * coordinates relative to the object-fit:contain content box.
 */
export function pointerToNormalized(
  pointer: { clientX: number; clientY: number },
  viewportRect: { left: number; top: number; width: number; height: number },
  image: Size,
): { x: number; y: number } | null {
  const localX = pointer.clientX - viewportRect.left;
  const localY = pointer.clientY - viewportRect.top;
  const bounds = getContainedImageBounds(
    { width: viewportRect.width, height: viewportRect.height },
    image,
  );

  if (bounds.width <= 0 || bounds.height <= 0) return null;

  const x = (localX - bounds.x) / bounds.width;
  const y = (localY - bounds.y) / bounds.height;

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
  points: Array<{ x: number; y: number }>,
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
): Array<{ x: number; y: number }> {
  if (!path.trim() || viewBoxWidth <= 0 || viewBoxHeight <= 0) return [];
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push({
      x: clampNormalized(nums[i]! / viewBoxWidth),
      y: clampNormalized(nums[i + 1]! / viewBoxHeight),
    });
  }
  return points;
}
