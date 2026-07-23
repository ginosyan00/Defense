import type {
  SpatialHotspotBase,
  SpatialInteractionType,
  SpatialVisualStatus,
} from "@/types/spatial";

export type MasterplanVisualStatus = SpatialVisualStatus;
export type MasterplanInteractionType = SpatialInteractionType;

export type MasterplanAssetContract = {
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

export type MasterplanHotspotContract = SpatialHotspotBase & {
  entityType: "district";
  entityId: string;
  slug: string;
  buildingCount: number;
  minPrice: number | null;
  currency: string;
  completionDate: string | null;
  href: string;
  sortOrder: number;
};

export type MasterplanPayload = {
  project: {
    id: string;
    slug: string;
    name: string;
    description: string;
    location: string;
  };
  asset: MasterplanAssetContract;
  hotspots: MasterplanHotspotContract[];
};
