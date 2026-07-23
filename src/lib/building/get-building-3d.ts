import type { Building3DPayload } from "@/types/building-3d";
import { prisma } from "@/lib/db";

export async function getBuilding3DPayload(
  projectSlug: string,
  districtSlug: string,
  buildingSlug: string,
): Promise<Building3DPayload | null> {
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

  return {
    building: {
      id: building.id,
      name: building.name,
      slug: building.slug,
      buildingNumber: building.buildingNumber,
      model3dUrl: building.model3dUrl,
      previewImageUrl: building.previewImageUrl,
    },
    floors: building.floors.map((floor) => {
      const visible = floor.apartments.filter((apt) => apt.status !== "HIDDEN");
      const available = visible.filter((apt) => apt.status === "AVAILABLE");
      return {
        id: floor.id,
        floorNumber: floor.floorNumber,
        name: floor.name,
        meshName: floor.meshName,
        availableApartmentCount: available.length,
        totalApartmentCount: visible.length,
        href: `/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}/floors/${floor.floorNumber}`,
      };
    }),
  };
}
