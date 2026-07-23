import { prisma } from "@/lib/db";
import type {
  BuildingHotspotContract,
  BuildingVisualStatus,
  DistrictPlanPayload,
} from "@/types/district-plan";
import type { BuildingStatus, DistrictStatus, InteractionType } from "@prisma/client";

function mapDistrictStatus(status: DistrictStatus): BuildingVisualStatus {
  switch (status) {
    case "AVAILABLE":
      return "AVAILABLE";
    case "COMING_SOON":
      return "COMING_SOON";
    case "SOLD_OUT":
      return "SOLD_OUT";
    case "HIDDEN":
      return "HIDDEN";
    default:
      return "DISABLED";
  }
}

function mapBuildingStatus(status: BuildingStatus): BuildingVisualStatus {
  switch (status) {
    case "UNDER_CONSTRUCTION":
    case "COMPLETED":
      return "AVAILABLE";
    case "PLANNING":
      return "COMING_SOON";
    case "SOLD_OUT":
      return "SOLD_OUT";
    case "HIDDEN":
      return "HIDDEN";
    default:
      return "DISABLED";
  }
}

function mapInteractionType(
  value: InteractionType,
): BuildingHotspotContract["interactionType"] {
  return value;
}

function placeholderDistrictAsset(districtSlug: string) {
  if (districtSlug === "district-a") {
    return {
      id: `placeholder-${districtSlug}`,
      imageUrl: `/masterplans/district-a-aerial.png`,
      mobileImageUrl: `/masterplans/district-a-aerial.png`,
      width: 1024,
      height: 512,
      viewBox: "0 0 1024 512",
      initialZoom: 1,
      minZoom: 1,
      maxZoom: 4,
    };
  }
  const known = districtSlug === "district-b" ? districtSlug : "district-b";
  return {
    id: `placeholder-${districtSlug}`,
    imageUrl: `/masterplans/${known}-placeholder.svg`,
    mobileImageUrl: `/masterplans/${known}-placeholder.svg`,
    width: 2000,
    height: 1400,
    viewBox: "0 0 2000 1400",
    initialZoom: 1,
    minZoom: 1,
    maxZoom: 4,
  };
}

/** Deterministic building layout inside district viewBox when DB coords missing. */
function fallbackBuildingLayout(
  index: number,
  total: number,
): { markerX: number; markerY: number; svgPath: string } {
  const cols = Math.min(3, Math.max(1, total));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const markerX = 0.28 + col * 0.22;
  const markerY = 0.35 + row * 0.28;
  const cx = markerX * 2000;
  const cy = markerY * 1400;
  const w = 140;
  const h = 200;
  return {
    markerX,
    markerY,
    svgPath: `M ${cx - w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy - h / 2} L ${cx + w / 2} ${cy + h / 2} L ${cx - w / 2} ${cy + h / 2} Z`,
  };
}

export async function getDistrictPlan(
  projectSlug: string,
  districtSlug: string,
): Promise<DistrictPlanPayload | null> {
  const district = await prisma.district.findFirst({
    where: {
      slug: districtSlug,
      project: { slug: projectSlug },
    },
    include: {
      project: true,
      masterplanAssets: {
        where: { variant: "DESKTOP" },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      buildings: {
        where: { status: { not: "HIDDEN" } },
        orderBy: { sortOrder: "asc" },
        include: {
          floors: {
            include: {
              apartments: {
                where: { status: "AVAILABLE" },
                select: { id: true, price: true, currency: true },
              },
            },
          },
        },
      },
    },
  });

  if (!district) return null;

  const assetRow = district.masterplanAssets[0];
  const asset = assetRow
    ? {
        id: assetRow.id,
        imageUrl: assetRow.imageUrl,
        mobileImageUrl: assetRow.mobileImageUrl,
        width: assetRow.width,
        height: assetRow.height,
        viewBox: assetRow.viewBox,
        initialZoom: assetRow.initialZoom,
        minZoom: assetRow.minZoom,
        maxZoom: assetRow.maxZoom,
      }
    : placeholderDistrictAsset(district.slug);

  const buildings: BuildingHotspotContract[] = district.buildings.map(
    (building, index) => {
      const apartments = building.floors.flatMap((floor) => floor.apartments);
      const minPrice =
        apartments.length > 0
          ? Math.min(...apartments.map((apt) => apt.price))
          : null;
      const layout =
        building.markerX != null && building.markerY != null
          ? {
              markerX: building.markerX,
              markerY: building.markerY,
              svgPath: building.svgPath,
            }
          : fallbackBuildingLayout(index, district.buildings.length);

      return {
        id: building.id,
        entityType: "building",
        entityId: building.id,
        slug: building.slug,
        label: building.markerLabel ?? building.buildingNumber,
        title: building.name,
        buildingNumber: building.buildingNumber,
        interactionType: mapInteractionType(building.interactionType),
        markerX: layout.markerX,
        markerY: layout.markerY,
        svgPath: layout.svgPath,
        status: mapBuildingStatus(building.status),
        floorsCount: building.floors.length,
        availableApartmentCount: apartments.length,
        minPrice,
        currency: apartments[0]?.currency ?? "AMD",
        completionDate: building.completionDate?.toISOString() ?? null,
        href: `/projects/${projectSlug}/districts/${district.slug}/buildings/${building.slug}`,
        sortOrder: building.sortOrder,
      };
    },
  );

  return {
    project: {
      id: district.project.id,
      slug: district.project.slug,
      name: district.project.name,
    },
    district: {
      id: district.id,
      slug: district.slug,
      name: district.name,
      description: district.description,
      status: mapDistrictStatus(district.status),
    },
    asset,
    buildings,
  };
}
