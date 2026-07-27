import { prisma } from "@/lib/db";
import { getDistrictPlaceholderAsset } from "@/lib/district/placeholder-asset";
import { formatMarkerLabel } from "@/lib/format-marker-label";
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

/** Deterministic building layout in the asset's own pixel space. */
function fallbackBuildingLayout(
  index: number,
  total: number,
  width: number,
  height: number,
): { markerX: number; markerY: number; svgPath: string } {
  const cols = Math.min(3, Math.max(1, total));
  const col = index % cols;
  const row = Math.floor(index / cols);
  const markerX = 0.28 + col * 0.22;
  const markerY = 0.35 + row * 0.28;
  const cx = markerX * width;
  const cy = markerY * height;
  const w = width * 0.07;
  const h = height * 0.14;
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
    : getDistrictPlaceholderAsset(district.slug);

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
          : fallbackBuildingLayout(
              index,
              district.buildings.length,
              asset.width,
              asset.height,
            );

      return {
        id: building.id,
        entityType: "building",
        entityId: building.id,
        slug: building.slug,
        label: formatMarkerLabel(
          building.markerLabel ?? building.buildingNumber,
        ),
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
