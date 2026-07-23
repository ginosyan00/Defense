import { prisma } from "@/lib/db";
import {
  FLOOR_PLAN_SIZE,
  FLOOR_PLAN_VIEWBOX,
  pathForApartmentSlot,
} from "@/lib/floor/layout";
import type {
  ApartmentPlanStatus,
  FloorApartmentContract,
  FloorPlanPayload,
} from "@/types/floor-plan";
import type { ApartmentStatus } from "@prisma/client";

function mapStatus(status: ApartmentStatus): ApartmentPlanStatus {
  return status;
}

export async function getFloorPlan(
  projectSlug: string,
  districtSlug: string,
  buildingSlug: string,
  floorNumber: number,
): Promise<FloorPlanPayload | null> {
  const floor = await prisma.floor.findFirst({
    where: {
      floorNumber,
      building: {
        slug: buildingSlug,
        district: {
          slug: districtSlug,
          project: { slug: projectSlug },
        },
      },
    },
    include: {
      building: {
        include: {
          district: {
            include: { project: true },
          },
        },
      },
      apartments: {
        orderBy: { apartmentNumber: "asc" },
      },
    },
  });

  if (!floor) return null;

  const hasRaster = Boolean(floor.floorPlanPreviewUrl);
  const width = floor.floorPlanImageWidth ?? FLOOR_PLAN_SIZE.width;
  const height = floor.floorPlanImageHeight ?? FLOOR_PLAN_SIZE.height;
  const viewBox = hasRaster
    ? `0 0 ${width} ${height}`
    : FLOOR_PLAN_VIEWBOX;

  const visible = floor.apartments.filter((apt) => apt.status !== "HIDDEN");
  const apartments: FloorApartmentContract[] = visible.map((apt, index) => ({
    id: apt.id,
    slug: apt.slug,
    apartmentNumber: apt.apartmentNumber,
    svgElementId: apt.svgElementId,
    // Only real admin drawings — never invent fallback polygons on raster plans.
    svgPath: apt.svgPath,
    rooms: apt.rooms,
    bedrooms: apt.bedrooms,
    bathrooms: apt.bathrooms,
    balconies: apt.balconies,
    totalArea: apt.totalArea,
    livingArea: apt.livingArea,
    balconyArea: apt.balconyArea,
    price: apt.price,
    pricePerSquareMeter: apt.pricePerSquareMeter,
    currency: apt.currency,
    status: mapStatus(apt.status),
    href: `/apartments/${apt.slug}`,
    sortOrder: index,
  }));

  // Procedural plate only when there is no uploaded floor-plan image.
  if (!hasRaster) {
    for (let index = 0; index < apartments.length; index += 1) {
      const apartment = apartments[index]!;
      if (!apartment.svgPath) {
        apartment.svgPath = pathForApartmentSlot(index);
      }
    }
  }

  return {
    project: {
      slug: floor.building.district.project.slug,
      name: floor.building.district.project.name,
    },
    district: {
      slug: floor.building.district.slug,
      name: floor.building.district.name,
    },
    building: {
      slug: floor.building.slug,
      name: floor.building.name,
      buildingNumber: floor.building.buildingNumber,
    },
    floor: {
      id: floor.id,
      floorNumber: floor.floorNumber,
      name: floor.name,
      meshName: floor.meshName,
      viewBox,
      width,
      height,
      imageUrl: floor.floorPlanPreviewUrl
        ? `${floor.floorPlanPreviewUrl}?v=${floor.updatedAt.getTime()}`
        : null,
    },
    apartments,
  };
}
