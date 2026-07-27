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

type ProjectWithMasterplan = NonNullable<
  Awaited<ReturnType<typeof loadProject>>
>;

async function loadProject(projectSlug: string) {
  return prisma.project.findUnique({
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
}

function buildHotspots(
  project: ProjectWithMasterplan,
): MasterplanHotspotContract[] {
  return project.districts
    .filter((d) => d.markerX != null && d.markerY != null)
    .map((district) => {
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
        entityType: "district" as const,
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
    });
}

/**
 * Loads masterplan payload from Neon.
 * Missing project → demo placeholder (local QA).
 * Real project without asset → placeholder aerial + real mapped districts only
 * (never invents fake district-a…d hrefs under a live project).
 */
export async function getProjectMasterplan(
  projectSlug: string,
): Promise<MasterplanPayload | null> {
  const project = await loadProject(projectSlug);

  if (!project) {
    return getPlaceholderMasterplanPayload(projectSlug);
  }

  const asset = project.masterplanAssets[0];
  const hotspots = buildHotspots(project);
  const placeholder = getPlaceholderMasterplanPayload(project.slug);

  return {
    project: {
      id: project.id,
      slug: project.slug,
      name: project.name,
      description: project.description,
      location: project.location,
    },
    asset: asset
      ? {
          id: asset.id,
          imageUrl: asset.imageUrl,
          mobileImageUrl: asset.mobileImageUrl,
          width: asset.width,
          height: asset.height,
          viewBox: asset.viewBox,
          initialZoom: asset.initialZoom,
          minZoom: asset.minZoom,
          maxZoom: asset.maxZoom,
        }
      : placeholder.asset,
    hotspots,
  };
}
