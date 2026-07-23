import { describe, expect, it } from "vitest";
import {
  normalizedPointsToSvgPath,
  pointerToNormalized,
  svgPathToNormalizedPoints,
} from "@/lib/admin/mapping-math";

describe("admin mapping math", () => {
  it("maps pointer inside contain-box to normalized coords", () => {
    const point = pointerToNormalized(
      { clientX: 100 + 300, clientY: 50 + 200 },
      { left: 100, top: 50, width: 600, height: 400 },
      { width: 2400, height: 1600 },
    );
    expect(point).not.toBeNull();
    expect(point!.x).toBeGreaterThan(0);
    expect(point!.x).toBeLessThan(1);
    expect(point!.y).toBeGreaterThan(0);
    expect(point!.y).toBeLessThan(1);
  });

  it("round-trips polygon points through SVG path", () => {
    const points = [
      { x: 0.2, y: 0.2 },
      { x: 0.5, y: 0.25 },
      { x: 0.45, y: 0.55 },
    ];
    const path = normalizedPointsToSvgPath(points, 2400, 1600);
    expect(path.startsWith("M")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    const back = svgPathToNormalizedPoints(path, 2400, 1600);
    expect(back).toHaveLength(3);
    expect(back[0].x).toBeCloseTo(0.2, 3);
    expect(back[0].y).toBeCloseTo(0.2, 3);
  });
});
