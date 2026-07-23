import type { NormalizedPoint } from "@/lib/coordinates";

export type CoordinateSystem = "NORMALIZED";

export type RegionPointsPayload = {
  version: 1;
  coordinateSystem: CoordinateSystem;
  closed: boolean;
  points: NormalizedPoint[];
};

export type EditorRegion = {
  id: string;
  title: string;
  label: string | null;
  points: NormalizedPoint[];
  closed: boolean;
  destinationType: string;
  destinationEntityId: string | null;
  customUrl: string | null;
  status: "DRAFT" | "PUBLISHED";
};

export type EditorTool =
  | "select"
  | "draw-polygon"
  | "pan";

export type ViewportTransform = {
  scale: number;
  tx: number;
  ty: number;
};

export function createEmptyPointsPayload(
  points: NormalizedPoint[] = [],
  closed = false,
): RegionPointsPayload {
  return {
    version: 1,
    coordinateSystem: "NORMALIZED",
    closed,
    points,
  };
}

export function parsePointsPayload(raw: unknown): RegionPointsPayload | null {
  if (!raw || typeof raw !== "object") return null;
  const value = raw as Record<string, unknown>;
  if (value.version !== 1) return null;
  if (value.coordinateSystem !== "NORMALIZED") return null;
  if (!Array.isArray(value.points)) return null;
  const points: NormalizedPoint[] = [];
  for (const item of value.points) {
    if (!item || typeof item !== "object") return null;
    const point = item as Record<string, unknown>;
    if (typeof point.x !== "number" || typeof point.y !== "number") return null;
    points.push({ x: point.x, y: point.y });
  }
  return {
    version: 1,
    coordinateSystem: "NORMALIZED",
    closed: Boolean(value.closed),
    points,
  };
}
