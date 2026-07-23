import { describe, expect, it } from "vitest";
import {
  FLOOR_PLAN_VIEWBOX,
  pathForApartmentSlot,
  TYPICAL_4_UNIT_PATHS,
} from "@/lib/floor/layout";

describe("floor plan layout", () => {
  it("exposes a stable viewBox and 4 unit paths", () => {
    expect(FLOOR_PLAN_VIEWBOX).toBe("0 0 1200 800");
    expect(TYPICAL_4_UNIT_PATHS).toHaveLength(4);
  });

  it("maps apartment slots cyclically for svgElementId binding", () => {
    expect(pathForApartmentSlot(0)).toBe(TYPICAL_4_UNIT_PATHS[0]);
    expect(pathForApartmentSlot(4)).toBe(TYPICAL_4_UNIT_PATHS[0]);
    expect(pathForApartmentSlot(1)).toContain("640 80");
  });
});
