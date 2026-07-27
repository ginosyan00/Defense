import { describe, expect, it } from "vitest";
import {
  canNavigateSpatialStatus,
  isMutedSpatialStatus,
} from "@/lib/spatial-status";

describe("spatial status helpers", () => {
  it("allows navigation for available and sold-out only", () => {
    expect(canNavigateSpatialStatus("AVAILABLE")).toBe(true);
    expect(canNavigateSpatialStatus("SOLD_OUT")).toBe(true);
    expect(canNavigateSpatialStatus("COMING_SOON")).toBe(false);
    expect(canNavigateSpatialStatus("DISABLED")).toBe(false);
    expect(canNavigateSpatialStatus("HIDDEN")).toBe(false);
  });

  it("marks coming soon / sold / disabled as muted", () => {
    expect(isMutedSpatialStatus("COMING_SOON")).toBe(true);
    expect(isMutedSpatialStatus("SOLD_OUT")).toBe(true);
    expect(isMutedSpatialStatus("DISABLED")).toBe(true);
    expect(isMutedSpatialStatus("AVAILABLE")).toBe(false);
  });
});
