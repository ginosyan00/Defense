import { prisma } from "@/lib/db";
import type {
  ApartmentDetailsPayload,
  ApartmentPlanStatus,
} from "@/types/floor-plan";
import type { ApartmentStatus } from "@prisma/client";

function mapStatus(status: ApartmentStatus): ApartmentPlanStatus {
  return status;
}

export async function getApartmentDetails(
  apartmentSlug: string,
): Promise<ApartmentDetailsPayload | null> {
  const apartment = await prisma.apartment.findUnique({
    where: { slug: apartmentSlug },
    include: {
      media: { orderBy: { sortOrder: "asc" } },
      floor: {
        include: {
          entrance: true,
          building: {
            include: {
              district: {
                include: { project: true },
              },
            },
          },
        },
      },
    },
  });

  if (!apartment || apartment.status === "HIDDEN") return null;

  const { floor } = apartment;
  const { building } = floor;
  const { district } = building;
  const { project } = district;

  return {
    apartment: {
      id: apartment.id,
      slug: apartment.slug,
      apartmentNumber: apartment.apartmentNumber,
      rooms: apartment.rooms,
      bedrooms: apartment.bedrooms,
      bathrooms: apartment.bathrooms,
      balconies: apartment.balconies,
      totalArea: apartment.totalArea,
      livingArea: apartment.livingArea,
      balconyArea: apartment.balconyArea,
      ceilingHeight: apartment.ceilingHeight,
      orientation: apartment.orientation,
      viewType: apartment.viewType,
      price: apartment.price,
      pricePerSquareMeter: apartment.pricePerSquareMeter,
      currency: apartment.currency,
      status: mapStatus(apartment.status),
      planImageUrl: apartment.planImageUrl,
      pdfUrl: apartment.pdfUrl,
      description: apartment.description,
      svgElementId: apartment.svgElementId,
    },
    project: { slug: project.slug, name: project.name },
    district: { slug: district.slug, name: district.name },
    building: {
      slug: building.slug,
      name: building.name,
      buildingNumber: building.buildingNumber,
    },
    entrance: floor.entrance
      ? { name: floor.entrance.name, number: floor.entrance.number }
      : null,
    floor: {
      floorNumber: floor.floorNumber,
      name: floor.name,
    },
    floorPlanHref: `/projects/${project.slug}/districts/${district.slug}/buildings/${building.slug}/floors/${floor.floorNumber}`,
    media: apartment.media.map((item) => ({
      id: item.id,
      url: item.url,
      alt: item.alt,
      type: item.type,
    })),
  };
}
