import type { MasterplanPayload } from "@/types/masterplan";

/** Intrinsic size of the placeholder aerial render. */
export const PLACEHOLDER_MASTERPLAN_SIZE = {
  width: 2400,
  height: 1600,
} as const;

/**
 * Demo masterplan payload used when DB spatial fields are not yet seeded,
 * and as a stable fixture for coordinate alignment tests.
 */
export function getPlaceholderMasterplanPayload(
  projectSlug = "defense-residence",
): MasterplanPayload {
  return {
    project: {
      id: "demo-project",
      slug: projectSlug,
      name: "Defense Residence",
      description:
        "Ճարտարապետական թաղամաս՝ ինտերակտիվ aerial masterplan ներկայացմամբ։",
      location: "Yerevan, Armenia",
    },
    asset: {
      id: "demo-masterplan-desktop",
      imageUrl: "/masterplans/placeholder-aerial.svg",
      mobileImageUrl: "/masterplans/placeholder-aerial.svg",
      width: PLACEHOLDER_MASTERPLAN_SIZE.width,
      height: PLACEHOLDER_MASTERPLAN_SIZE.height,
      viewBox: `0 0 ${PLACEHOLDER_MASTERPLAN_SIZE.width} ${PLACEHOLDER_MASTERPLAN_SIZE.height}`,
      initialZoom: 1,
      minZoom: 1,
      maxZoom: 4,
    },
    hotspots: [
      {
        id: "district-a",
        entityType: "district",
        entityId: "district-a",
        slug: "district-a",
        label: "Ա",
        title: "Թաղամաս Ա",
        interactionType: "MARKER_AND_POLYGON",
        markerX: 0.28,
        markerY: 0.42,
        svgPath:
          "M 420 480 L 780 420 L 860 720 L 480 780 Z",
        status: "AVAILABLE",
        buildingCount: 6,
        availableApartmentCount: 48,
        minPrice: 42000000,
        currency: "AMD",
        completionDate: "2026-12-01T00:00:00.000Z",
        href: `/projects/${projectSlug}/districts/district-a`,
        sortOrder: 1,
      },
      {
        id: "district-b",
        entityType: "district",
        entityId: "district-b",
        slug: "district-b",
        label: "Բ",
        title: "Թաղամաս Բ",
        interactionType: "MARKER_AND_POLYGON",
        markerX: 0.58,
        markerY: 0.36,
        svgPath:
          "M 1180 360 L 1580 320 L 1680 640 L 1240 700 Z",
        status: "AVAILABLE",
        buildingCount: 4,
        availableApartmentCount: 22,
        minPrice: 51000000,
        currency: "AMD",
        completionDate: "2027-06-01T00:00:00.000Z",
        href: `/projects/${projectSlug}/districts/district-b`,
        sortOrder: 2,
      },
      {
        id: "district-g",
        entityType: "district",
        entityId: "district-g",
        slug: "district-g",
        label: "Գ",
        title: "Թաղամաս Գ",
        interactionType: "MARKER_AND_POLYGON",
        markerX: 0.72,
        markerY: 0.62,
        svgPath:
          "M 1480 860 L 1860 820 L 1920 1120 L 1520 1180 Z",
        status: "COMING_SOON",
        buildingCount: 5,
        availableApartmentCount: 0,
        minPrice: null,
        currency: "AMD",
        completionDate: "2028-03-01T00:00:00.000Z",
        href: `/projects/${projectSlug}/districts/district-g`,
        sortOrder: 3,
      },
      {
        id: "district-d",
        entityType: "district",
        entityId: "district-d",
        slug: "district-d",
        label: "Դ",
        title: "Թաղամաս Դ",
        interactionType: "MARKER_AND_POLYGON",
        markerX: 0.38,
        markerY: 0.7,
        svgPath:
          "M 640 980 L 980 940 L 1040 1220 L 700 1280 Z",
        status: "SOLD_OUT",
        buildingCount: 3,
        availableApartmentCount: 0,
        minPrice: null,
        currency: "AMD",
        completionDate: "2025-11-01T00:00:00.000Z",
        href: `/projects/${projectSlug}/districts/district-d`,
        sortOrder: 4,
      },
    ],
  };
}
