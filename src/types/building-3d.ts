export type BuildingFloor3D = {
  id: string;
  floorNumber: number;
  name: string;
  meshName: string;
  availableApartmentCount: number;
  totalApartmentCount: number;
  href: string;
};

export type Building3DPayload = {
  building: {
    id: string;
    name: string;
    slug: string;
    buildingNumber: string;
    model3dUrl: string | null;
    previewImageUrl: string | null;
  };
  floors: BuildingFloor3D[];
};
