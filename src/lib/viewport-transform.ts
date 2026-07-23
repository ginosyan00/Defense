export type ViewportTransform = {
  x: number;
  y: number;
  scale: number;
};

export function createIdentityTransform(initialZoom = 1): ViewportTransform {
  return { x: 0, y: 0, scale: initialZoom };
}

export function clampScale(
  scale: number,
  minZoom: number,
  maxZoom: number,
): number {
  return Math.min(maxZoom, Math.max(minZoom, scale));
}

export function toCssTransform(transform: ViewportTransform): string {
  return `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${transform.scale})`;
}

/**
 * Zoom toward a point in the viewport (client coords relative to viewport).
 */
export function zoomAtPoint(
  current: ViewportTransform,
  nextScale: number,
  point: { x: number; y: number },
): ViewportTransform {
  const ratio = nextScale / current.scale;
  return {
    scale: nextScale,
    x: point.x - (point.x - current.x) * ratio,
    y: point.y - (point.y - current.y) * ratio,
  };
}

export const DRAG_THRESHOLD_PX = 8;
