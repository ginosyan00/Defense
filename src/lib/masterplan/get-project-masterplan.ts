import { prisma } from "@/lib/db";
import { getPlaceholderMasterplanPayload } from "@/lib/masterplan/placeholder-payload";
import type {
  MasterplanHotspotContract,
  MasterplanPayload,
  MasterplanVisualStatus,
} from "@/types/masterplan";
import type { DistrictStatus, InteractionType } from "@prisma/client";

function mapDistrictStatus(status: DistrictStatus): MasterplanVisualStatus {
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

function mapInteractionType(
  value: InteractionType,
): MasterplanHotspotContract["interactionType"] {
  return value;
}

/**
 * Loads masterplan payload from Neon. Falls back to placeholder when
 * spatial asset or marker mappings are incomplete.
 */
export async function getProjectMasterplan(
  projectSlug: string,
): Promise<MasterplanPayload | null> {
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      masterplanAssets: {
        where: { variant: "DESKTOP", districtId: null },
        orderBy: { sortOrder: "asc" },
        take: 1,
      },
      districts: {
        where: { status: { not: "HIDDEN" } },
        orderBy: { sortOrder: "asc" },
        include: {
          buildings: {
            where: { status: { not: "HIDDEN" } },
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
      },
    },
  });

  if (!project) {
    // Local QA fallback for unknown slugs during MVP.
    if (projectSlug === "defense-residence") return null;
    return getPlaceholderMasterplanPayload(projectSlug);
  }

  const asset = project.masterplanAssets[0];
  const districtsWithCoords = project.districts.filter(
    (d) => d.markerX != null && d.markerY != null,
  );

  if (!asset || districtsWithCoords.length === 0) {
    const fallback = getPlaceholderMasterplanPayload(project.slug);
    return {
      ...fallback,
      project: {
        id: project.id,
        slug: project.slug,
        name: project.name,
        description: project.description,
        location: project.location,
      },
    };
  }

  const hotspots: MasterplanHotspotContract[] = districtsWithCoords.map(
    (district) => {
      const apartments = district.buildings.flatMap((building) =>
        building.floors.flatMap((floor) => floor.apartments),
      );
      const minPrice =
        apartments.length > 0
          ? Math.min(...apartments.map((apt) => apt.price))
          : null;
      const currency = apartments[0]?.currency ?? "AMD";

      return {
        id: district.id,
        entityType: "district",
        entityId: district.id,
        slug: district.slug,
        label: district.markerLabel ?? district.name.slice(0, 1),
        title: district.name,
        interactionType: mapInteractionType(district.interactionType),
        markerX: district.markerX as number,
        markerY: district.markerY as number,
        svgPath: district.svgPath,
        status: mapDistrictStatus(district.status),
        buildingCount: district.buildings.length,
        availableApartmentCount: apartments.length,
        minPrice,
        currency,
        completionDate: district.completionDate?.toISOString() ?? null,
        href: `/projects/${project.slug}/districts/${district.slug}`,
        sortOrder: district.sortOrder,
      };
    },
  );

  return {
    project: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      description: project.description,
      location: project.location,
    },
    asset: {
      id: asset.id,
      imageUrl: asset.imageUrl,
      mobileImageUrl: asset.mobileImageUrl,
      width: asset.width,
      height: asset.height,
      viewBox: asset.viewBox,
      initialZoom: asset.initialZoom,
      minZoom: asset.minZoom,
      maxZoom: asset.maxZoom,
    },
    hotspots,
  };
}
