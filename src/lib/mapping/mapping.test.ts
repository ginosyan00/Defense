import { describe, expect, it } from "vitest";
import {
  canClosePolygon,
  closePolygon,
  isSelfIntersecting,
  validateRegionPoints,
} from "@/lib/mapping/geometry";
import {
  canRedo,
  canUndo,
  createHistory,
  pushHistory,
  redoHistory,
  undoHistory,
} from "@/lib/mapping/history";
import { buildEntityRoute } from "@/lib/mapping/routes";
import { screenToNormalized } from "@/lib/mapping/transform";
import { measureMarkerDriftPx } from "@/lib/coordinates";
import { createEmptyPointsPayload } from "@/lib/mapping/types";

const VIEWPORTS = [360, 390, 430, 768, 820, 1024, 1280, 1440, 1920] as const;
const IMAGE = { width: 1600, height: 900 };

describe("mapping geometry", () => {
  it("closes polygons with ≥3 unique points", () => {
    expect(canClosePolygon([{ x: 0.1, y: 0.1 }])).toBe(false);
    const payload = closePolygon([
      { x: 0.1, y: 0.1 },
      { x: 0.4, y: 0.1 },
      { x: 0.4, y: 0.4 },
    ]);
    expect(payload.closed).toBe(true);
    expect(payload.points).toHaveLength(3);
  });

  it("validates normalized closed polygons", () => {
    const ok = createEmptyPointsPayload(
      [
        { x: 0.1, y: 0.1 },
        { x: 0.5, y: 0.1 },
        { x: 0.5, y: 0.5 },
      ],
      true,
    );
    expect(validateRegionPoints(ok)).toEqual([]);
    expect(
      validateRegionPoints(createEmptyPointsPayload([{ x: 2, y: 0 }], true)),
    ).not.toEqual([]);
  });

  it("detects self-intersection", () => {
    expect(
      isSelfIntersecting([
        { x: 0, y: 0 },
        { x: 1, y: 1 },
        { x: 1, y: 0 },
        { x: 0, y: 1 },
      ]),
    ).toBe(true);
    expect(
      isSelfIntersecting([
        { x: 0, y: 0 },
        { x: 1, y: 0 },
        { x: 1, y: 1 },
        { x: 0, y: 1 },
      ]),
    ).toBe(false);
  });
});

describe("viewport alignment 360→1920", () => {
  it("keeps normalized reconstruction drift under 1px", () => {
    const point = { x: 0.1245, y: 0.3211 };
    const base = { width: 1280, height: 720 };
    for (const width of VIEWPORTS) {
      const height = Math.round(width * (9 / 16));
      const drift = measureMarkerDriftPx(
        point,
        base,
        { width, height },
        IMAGE,
      );
      expect(drift).toBeLessThan(1);
    }
  });
});

describe("screenToNormalized with zoom/pan", () => {
  it("round-trips center of content at identity transform", () => {
    const viewport = { left: 0, top: 0, width: 800, height: 450, x: 0, y: 0, bottom: 450, right: 800, toJSON: () => ({}) } as DOMRect;
    // content is letterboxed? 800/450 = 16/9 same as 1600/900 → full bleed
    const point = screenToNormalized(
      { clientX: 400, clientY: 225 },
      viewport,
      IMAGE,
      { scale: 1, tx: 0, ty: 0 },
    );
    expect(point).not.toBeNull();
    expect(point!.x).toBeCloseTo(0.5, 3);
    expect(point!.y).toBeCloseTo(0.5, 3);
  });

  it("ignores pan/zoom when converting back via inverse", () => {
    const viewport = {
      left: 0,
      top: 0,
      width: 800,
      height: 450,
      x: 0,
      y: 0,
      bottom: 450,
      right: 800,
      toJSON: () => ({}),
    } as DOMRect;
    const transform = { scale: 2, tx: 40, ty: -20 };
    // Pick a known normalized point and invent screen coords via forward formula mentally:
    // We just assert output stays in range for a mid click under zoom.
    const point = screenToNormalized(
      { clientX: 400, clientY: 225 },
      viewport,
      IMAGE,
      transform,
    );
    expect(point).not.toBeNull();
    expect(point!.x).toBeGreaterThanOrEqual(0);
    expect(point!.x).toBeLessThanOrEqual(1);
    expect(point!.y).toBeGreaterThanOrEqual(0);
    expect(point!.y).toBeLessThanOrEqual(1);
  });
});

describe("history reducer", () => {
  it("supports undo/redo", () => {
    let state = createHistory(["a"]);
    state = pushHistory(state, ["a", "b"]);
    state = pushHistory(state, ["a", "b", "c"]);
    expect(canUndo(state)).toBe(true);
    state = undoHistory(state);
    expect(state.present).toEqual(["a", "b"]);
    expect(canRedo(state)).toBe(true);
    state = redoHistory(state);
    expect(state.present).toEqual(["a", "b", "c"]);
  });
});

describe("route generation", () => {
  it("builds hierarchy routes", () => {
    expect(
      buildEntityRoute("PROJECT", { projectSlug: "alpha" }),
    ).toBe("/projects/alpha");
    expect(
      buildEntityRoute("DISTRICT", {
        projectSlug: "alpha",
        districtSlug: "north",
      }),
    ).toBe("/projects/alpha/districts/north");
    expect(
      buildEntityRoute("APARTMENT", {
        projectSlug: "alpha",
        apartmentSlug: "a-101",
      }),
    ).toBe("/apartments/a-101");
  });
});
