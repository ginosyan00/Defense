import type { SpatialVisualStatus } from "@/types/spatial";

/**
 * District / building hotspots that may be opened (map, list, tooltip CTA).
 * COMING_SOON and DISABLED stay informational only.
 */
export function canNavigateSpatialStatus(
  status: SpatialVisualStatus,
): boolean {
  return status === "AVAILABLE" || status === "SOLD_OUT";
}

export function isMutedSpatialStatus(status: SpatialVisualStatus): boolean {
  return (
    status === "COMING_SOON" ||
    status === "SOLD_OUT" ||
    status === "DISABLED"
  );
}
