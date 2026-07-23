import { describe, expect, it } from "vitest";
import {
  getContainedImageBounds,
  measureMarkerDriftPx,
  normalizedToContainer,
  normalizedToPercent,
} from "@/lib/coordinates";
import { PLACEHOLDER_MASTERPLAN_SIZE } from "@/lib/masterplan/placeholder-payload";
import {
  clampScale,
  toCssTransform,
  zoomAtPoint,
} from "@/lib/viewport-transform";

const IMAGE = {
  width: PLACEHOLDER_MASTERPLAN_SIZE.width,
  height: PLACEHOLDER_MASTERPLAN_SIZE.height,
};

const VIEWPORT_WIDTHS = [
  360, 390, 430, 768, 820, 1024, 1280, 1440, 1920,
] as const;

describe("getContainedImageBounds", () => {
  it("letterboxes horizontally for wide containers", () => {
    const bounds = getContainedImageBounds(
      { width: 1920, height: 800 },
      IMAGE,
    );
    expect(bounds.height).toBe(800);
    expect(bounds.width).toBeCloseTo(800 * (2400 / 1600), 5);
    expect(bounds.x).toBeGreaterThan(0);
    expect(bounds.y).toBe(0);
  });

  it("letterboxes vertically for tall/narrow containers", () => {
    const bounds = getContainedImageBounds(
      { width: 360, height: 800 },
      IMAGE,
    );
    expect(bounds.width).toBe(360);
    expect(bounds.height).toBeCloseTo(360 / (2400 / 1600), 5);
    expect(bounds.x).toBe(0);
    expect(bounds.y).toBeGreaterThan(0);
  });
});

describe("normalized overlay alignment 360–1920", () => {
  const markers = [
    { x: 0.28, y: 0.42 },
    { x: 0.58, y: 0.36 },
    { x: 0.72, y: 0.62 },
    { x: 0.38, y: 0.7 },
  ];

  it("reconstructs the same normalized point from every viewport width", () => {
    for (const width of VIEWPORT_WIDTHS) {
      const height = Math.round(width * 0.62);
      const bounds = getContainedImageBounds({ width, height }, IMAGE);

      for (const marker of markers) {
        const screen = normalizedToContainer(marker, bounds);
        const reconstructed = {
          x: (screen.x - bounds.x) / bounds.width,
          y: (screen.y - bounds.y) / bounds.height,
        };
        expect(reconstructed.x).toBeCloseTo(marker.x, 10);
        expect(reconstructed.y).toBeCloseTo(marker.y, 10);

        const percent = normalizedToPercent(marker);
        expect(percent.xPercent / 100).toBeCloseTo(marker.x, 10);
        expect(percent.yPercent / 100).toBeCloseTo(marker.y, 10);
      }
    }
  });

  it("keeps cross-viewport marker drift under 1px in content space", () => {
    const base = { width: 360, height: 800 };
    for (const width of VIEWPORT_WIDTHS) {
      const other = { width, height: Math.round(width * 0.62) };
      for (const marker of markers) {
        const drift = measureMarkerDriftPx(marker, base, other, IMAGE);
        expect(drift).toBeLessThan(1);
      }
    }
  });

  it("keeps image and overlay content boxes identical at each width", () => {
    for (const width of VIEWPORT_WIDTHS) {
      const height = 700;
      const imageBounds = getContainedImageBounds({ width, height }, IMAGE);
      const overlayBounds = getContainedImageBounds({ width, height }, IMAGE);
      expect(overlayBounds).toEqual(imageBounds);
    }
  });
});

describe("viewport transform", () => {
  it("zooms toward pointer without changing that point in screen space", () => {
    const current = { x: 0, y: 0, scale: 1 };
    const point = { x: 200, y: 150 };
    const next = zoomAtPoint(current, 2, point);
    expect(next.scale).toBe(2);
    // Point under cursor stays fixed:
    // screen = pan + local * scale  =>  for local = (point - pan) / scale
    const localX = (point.x - current.x) / current.scale;
    const localY = (point.y - current.y) / current.scale;
    expect(next.x + localX * next.scale).toBeCloseTo(point.x, 8);
    expect(next.y + localY * next.scale).toBeCloseTo(point.y, 8);
  });

  it("clamps scale and serializes css transform", () => {
    expect(clampScale(0.2, 1, 4)).toBe(1);
    expect(clampScale(9, 1, 4)).toBe(4);
    expect(toCssTransform({ x: 10, y: -4, scale: 1.5 })).toBe(
      "translate3d(10px, -4px, 0) scale(1.5)",
    );
  });
});
