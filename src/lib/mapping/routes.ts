export type RouteSlugs = {
  projectSlug: string;
  districtSlug?: string;
  buildingSlug?: string;
  floorNumber?: number;
  apartmentSlug?: string;
};

export function buildEntityRoute(
  destinationType: string,
  slugs: RouteSlugs,
): string | null {
  switch (destinationType) {
    case "PROJECT":
      return `/projects/${slugs.projectSlug}`;
    case "DISTRICT":
      if (!slugs.districtSlug) return null;
      return `/projects/${slugs.projectSlug}/districts/${slugs.districtSlug}`;
    case "BUILDING":
    case "HOUSE":
      if (!slugs.districtSlug || !slugs.buildingSlug) return null;
      return `/projects/${slugs.projectSlug}/districts/${slugs.districtSlug}/buildings/${slugs.buildingSlug}`;
    case "FLOOR":
      if (
        !slugs.districtSlug ||
        !slugs.buildingSlug ||
        slugs.floorNumber === undefined
      ) {
        return null;
      }
      return `/projects/${slugs.projectSlug}/districts/${slugs.districtSlug}/buildings/${slugs.buildingSlug}/floors/${slugs.floorNumber}`;
    case "APARTMENT":
      if (!slugs.apartmentSlug) return null;
      return `/apartments/${slugs.apartmentSlug}`;
    default:
      return null;
  }
}
