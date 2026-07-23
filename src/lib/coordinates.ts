export type Rect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type Size = {
  width: number;
  height: number;
};

export type NormalizedPoint = {
  x: number;
  y: number;
};

/**
 * Computes the painted content box for object-fit: contain.
 * Hotspots must be mapped against this box, never the raw container.
 */
export function getContainedImageBounds(
  container: Size,
  image: Size,
): Rect {
  if (container.width <= 0 || container.height <= 0) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }
  if (image.width <= 0 || image.height <= 0) {
    return { x: 0, y: 0, width: container.width, height: container.height };
  }

  const containerRatio = container.width / container.height;
  const imageRatio = image.width / image.height;

  if (containerRatio > imageRatio) {
    const height = container.height;
    const width = height * imageRatio;
    return {
      x: (container.width - width) / 2,
      y: 0,
      width,
      height,
    };
  }

  const width = container.width;
  const height = width / imageRatio;
  return {
    x: 0,
    y: (container.height - height) / 2,
    width,
    height,
  };
}

export function normalizedToPercent(point: NormalizedPoint): {
  xPercent: number;
  yPercent: number;
} {
  return {
    xPercent: point.x * 100,
    yPercent: point.y * 100,
  };
}

export function percentToNormalized(xPercent: number, yPercent: number): NormalizedPoint {
  return { x: xPercent / 100, y: yPercent / 100 };
}

/** Project normalized point into content-local pixels. */
export function normalizedToContentLocal(
  point: NormalizedPoint,
  content: Size,
): { x: number; y: number } {
  return {
    x: point.x * content.width,
    y: point.y * content.height,
  };
}

/** Content-local → container (includes letterbox offsets). */
export function contentLocalToContainer(
  local: { x: number; y: number },
  bounds: Rect,
): { x: number; y: number } {
  return {
    x: bounds.x + local.x,
    y: bounds.y + local.y,
  };
}

export function normalizedToContainer(
  point: NormalizedPoint,
  bounds: Rect,
): { x: number; y: number } {
  return contentLocalToContainer(
    normalizedToContentLocal(point, bounds),
    bounds,
  );
}

export function clampNormalized(value: number): number {
  if (Number.isNaN(value)) return 0;
  return Math.min(1, Math.max(0, value));
}

export function isValidNormalizedPoint(point: NormalizedPoint): boolean {
  return (
    Number.isFinite(point.x) &&
    Number.isFinite(point.y) &&
    point.x >= 0 &&
    point.x <= 1 &&
    point.y >= 0 &&
    point.y <= 1
  );
}

/**
 * Max absolute drift (px) between expected marker centers across viewports
 * when using percent positioning inside the content box.
 */
export function measureMarkerDriftPx(
  point: NormalizedPoint,
  containerA: Size,
  containerB: Size,
  image: Size,
): number {
  const boundsA = getContainedImageBounds(containerA, image);
  const boundsB = getContainedImageBounds(containerB, image);
  const a = normalizedToContainer(point, boundsA);
  const b = normalizedToContainer(point, boundsB);

  // Compare position relative to content box (normalized reconstruction).
  const reconstructedA = {
    x: (a.x - boundsA.x) / boundsA.width,
    y: (a.y - boundsA.y) / boundsA.height,
  };
  const reconstructedB = {
    x: (b.x - boundsB.x) / boundsB.width,
    y: (b.y - boundsB.y) / boundsB.height,
  };

  const dx = Math.abs(reconstructedA.x - reconstructedB.x) * boundsB.width;
  const dy = Math.abs(reconstructedA.y - reconstructedB.y) * boundsB.height;
  return Math.max(dx, dy);
}
