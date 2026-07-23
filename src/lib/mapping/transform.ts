import {
  getContainedImageBounds,
  type NormalizedPoint,
  type Rect,
  type Size,
} from "@/lib/coordinates";
import type { ViewportTransform } from "@/lib/mapping/types";

export type ClientPoint = { clientX: number; clientY: number };

/**
 * Convert screen pointer → normalized image coords.
 * Viewport transform (zoom/pan) is inverted and never persisted.
 */
export function screenToNormalized(
  pointer: ClientPoint,
  viewportRect: DOMRect | Rect,
  image: Size,
  transform: ViewportTransform = { scale: 1, tx: 0, ty: 0 },
): NormalizedPoint | null {
  const left = "left" in viewportRect ? viewportRect.left : 0;
  const top = "top" in viewportRect ? viewportRect.top : 0;
  const width = viewportRect.width;
  const height = viewportRect.height;
  if (width <= 0 || height <= 0) return null;

  const localX = pointer.clientX - left;
  const localY = pointer.clientY - top;

  // Inverse pan/zoom around viewport center
  const cx = width / 2;
  const cy = height / 2;
  const unscaledX = (localX - cx - transform.tx) / transform.scale + cx;
  const unscaledY = (localY - cy - transform.ty) / transform.scale + cy;

  const bounds = getContainedImageBounds({ width, height }, image);
  if (bounds.width <= 0 || bounds.height <= 0) return null;

  return {
    x: (unscaledX - bounds.x) / bounds.width,
    y: (unscaledY - bounds.y) / bounds.height,
  };
}

export function normalizedToScreenPercent(
  point: NormalizedPoint,
): { x: number; y: number } {
  return { x: point.x * 100, y: point.y * 100 };
}

export function applyZoomAt(
  transform: ViewportTransform,
  factor: number,
  min = 0.5,
  max = 6,
): ViewportTransform {
  const next = Math.min(max, Math.max(min, transform.scale * factor));
  return { ...transform, scale: next };
}

export function resetTransform(): ViewportTransform {
  return { scale: 1, tx: 0, ty: 0 };
}
