import type { BuildingRenderFloor } from "@/components/building/BuildingRenderViewer";
import { prisma } from "@/lib/db";
import { formatMarkerLabel } from "@/lib/format-marker-label";
import type { InteractionType } from "@prisma/client";

const PLACEHOLDER_RENDER = "/buildings/building-render.png";
const PLACEHOLDER_WIDTH = 534;
const PLACEHOLDER_HEIGHT = 817;

export type BuildingRenderPayload = {
  building: {
    id: string;
    name: string;
    slug: string;
    buildingNumber: string;
    imageUrl: string;
    imageWidth: number;
    imageHeight: number;
    viewBox: string;
  };
  floors: BuildingRenderFloor[];
};

function mapInteraction(
  value: InteractionType,
): BuildingRenderFloor["interactionType"] {
  return value;
}

export async function getBuildingRenderPayload(
  projectSlug: string,
  districtSlug: string,
  buildingSlug: string,
): Promise<BuildingRenderPayload | null> {
  const building = await prisma.building.findFirst({
    where: {
      slug: buildingSlug,
      district: {
        slug: districtSlug,
        project: { slug: projectSlug },
      },
    },
    include: {
      floors: {
        orderBy: { sortOrder: "asc" },
        include: {
          apartments: {
            select: { id: true, status: true },
          },
        },
      },
    },
  });

  if (!building) return null;

  const imageUrl = building.previewImageUrl ?? PLACEHOLDER_RENDER;
  const imageWidth = building.previewImageWidth ?? PLACEHOLDER_WIDTH;
  const imageHeight = building.previewImageHeight ?? PLACEHOLDER_HEIGHT;
  const total = Math.max(building.floors.length, 1);

  return {
    building: {
      id: building.id,
      name: building.name,
      slug: building.slug,
      buildingNumber: building.buildingNumber,
      imageUrl: `${imageUrl}?v=${building.updatedAt.getTime()}`,
      imageWidth,
      imageHeight,
      viewBox: `0 0 ${imageWidth} ${imageHeight}`,
    },
    floors: building.floors.map((floor, index) => {
      const visible = floor.apartments.filter((apt) => apt.status !== "HIDDEN");
      const available = visible.filter((apt) => apt.status === "AVAILABLE");
      const band = 1 / total;
      return {
        id: floor.id,
        floorNumber: floor.floorNumber,
        name: floor.name,
        label: formatMarkerLabel(
          floor.markerLabel ?? String(floor.floorNumber),
        ),
        availableApartmentCount: available.length,
        markerX: floor.markerX ?? 0.5,
        markerY: floor.markerY ?? 0.12 + index * band * 0.75 + band * 0.35,
        svgPath: floor.svgPath,
        interactionType: mapInteraction(floor.interactionType),
        href: `/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}/floors/${floor.floorNumber}`,
      };
    }),
  };
}
