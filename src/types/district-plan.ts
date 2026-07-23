import type { SpatialVisualStatus } from "@/types/spatial";

export type BuildingVisualStatus = SpatialVisualStatus;

export type BuildingHotspotContract = {
  id: string;
  entityType: "building";
  entityId: string;
  slug: string;
  label: string;
  title: string;
  buildingNumber: string;
  interactionType: "MARKER" | "POLYGON" | "MARKER_AND_POLYGON";
  markerX: number;
  markerY: number;
  svgPath?: string | null;
  status: BuildingVisualStatus;
  floorsCount: number;
  availableApartmentCount: number;
  minPrice: number | null;
  currency: string;
  completionDate: string | null;
  href: string;
  sortOrder: number;
};

export type DistrictPlanAssetContract = {
  id: string;
  imageUrl: string;
  mobileImageUrl?: string | null;
  width: number;
  height: number;
  viewBox: string;
  initialZoom: number;
  minZoom: number;
  maxZoom: number;
};

export type DistrictPlanPayload = {
  project: {
    id: string;
    slug: string;
    name: string;
  };
  district: {
    id: string;
    slug: string;
    name: string;
    description: string;
    status: BuildingVisualStatus;
  };
  asset: DistrictPlanAssetContract;
  buildings: BuildingHotspotContract[];
};
