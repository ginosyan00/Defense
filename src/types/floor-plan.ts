export type ApartmentPlanStatus =
  | "AVAILABLE"
  | "RESERVED"
  | "SOLD"
  | "HIDDEN";

export type FloorApartmentContract = {
  id: string;
  slug: string;
  apartmentNumber: string;
  svgElementId: string;
  /** SVG path `d` in floor plan viewBox space; null until admin draws it */
  svgPath: string | null;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  totalArea: number;
  livingArea: number;
  balconyArea: number;
  price: number;
  pricePerSquareMeter: number;
  currency: string;
  status: ApartmentPlanStatus;
  href: string;
  sortOrder: number;
};

export type FloorPlanPayload = {
  project: { slug: string; name: string };
  district: { slug: string; name: string };
  building: { slug: string; name: string; buildingNumber: string };
  floor: {
    id: string;
    floorNumber: number;
    name: string;
    meshName: string;
    viewBox: string;
    width: number;
    height: number;
    /** Raster floor plan when admin uploaded one; otherwise procedural SVG. */
    imageUrl: string | null;
  };
  apartments: FloorApartmentContract[];
};

export type ApartmentDetailsPayload = {
  apartment: {
    id: string;
    slug: string;
    apartmentNumber: string;
    rooms: number;
    bedrooms: number;
    bathrooms: number;
    balconies: number;
    totalArea: number;
    livingArea: number;
    balconyArea: number;
    ceilingHeight: number;
    orientation: string | null;
    viewType: string | null;
    price: number;
    pricePerSquareMeter: number;
    currency: string;
    status: ApartmentPlanStatus;
    planImageUrl: string | null;
    pdfUrl: string | null;
    description: string | null;
    svgElementId: string;
  };
  project: { slug: string; name: string };
  district: { slug: string; name: string };
  building: { slug: string; name: string; buildingNumber: string };
  entrance: { name: string; number: number } | null;
  floor: { floorNumber: number; name: string };
  floorPlanHref: string;
  media: Array<{ id: string; url: string; alt: string | null; type: string }>;
};
