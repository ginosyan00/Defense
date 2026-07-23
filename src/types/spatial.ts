export type SpatialInteractionType =
  | "MARKER"
  | "POLYGON"
  | "MARKER_AND_POLYGON";

export type SpatialVisualStatus =
  | "AVAILABLE"
  | "COMING_SOON"
  | "SOLD_OUT"
  | "DISABLED"
  | "HIDDEN";

/** Minimal contract shared by masterplan + district overlays. */
export type SpatialHotspotBase = {
  id: string;
  label: string;
  title: string;
  interactionType: SpatialInteractionType;
  markerX: number;
  markerY: number;
  svgPath?: string | null;
  status: SpatialVisualStatus;
  availableApartmentCount: number;
};
