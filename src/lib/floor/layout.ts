/**
 * Typical 4-unit architectural floor plate in viewBox 0 0 1200 800.
 * Slot order maps to apartments sorted by apartmentNumber.
 */
export const FLOOR_PLAN_VIEWBOX = "0 0 1200 800";
export const FLOOR_PLAN_SIZE = { width: 1200, height: 800 } as const;

export const TYPICAL_4_UNIT_PATHS = [
  // NW unit
  "M 80 80 L 560 80 L 560 360 L 80 360 Z",
  // NE unit
  "M 640 80 L 1120 80 L 1120 360 L 640 360 Z",
  // SW unit
  "M 80 440 L 560 440 L 560 720 L 80 720 Z",
  // SE unit
  "M 640 440 L 1120 440 L 1120 720 L 640 720 Z",
] as const;

/** Corridor / core (non-interactive). */
export const FLOOR_CORE_PATH =
  "M 560 80 L 640 80 L 640 720 L 560 720 Z";

export function pathForApartmentSlot(index: number): string {
  return TYPICAL_4_UNIT_PATHS[index % TYPICAL_4_UNIT_PATHS.length] ?? TYPICAL_4_UNIT_PATHS[0];
}
