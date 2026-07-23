"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";

const normalized = z.number().min(0).max(1);

const districtMappingSchema = z.object({
  districtId: z.string().min(1),
  markerX: normalized,
  markerY: normalized,
  markerLabel: z.string().min(1).max(8),
  svgPath: z.string().nullable(),
  interactionType: z.enum(["MARKER", "POLYGON", "MARKER_AND_POLYGON"]),
  projectSlug: z.string().min(1),
});

const buildingMappingSchema = z.object({
  buildingId: z.string().min(1),
  markerX: normalized,
  markerY: normalized,
  markerLabel: z.string().min(1).max(8),
  svgPath: z.string().nullable(),
  interactionType: z.enum(["MARKER", "POLYGON", "MARKER_AND_POLYGON"]),
  projectSlug: z.string().min(1),
  districtSlug: z.string().min(1),
});

const apartmentSvgSchema = z.object({
  apartmentId: z.string().min(1),
  svgElementId: z.string().min(1).max(120),
  projectSlug: z.string().min(1),
  districtSlug: z.string().min(1),
  buildingSlug: z.string().min(1),
  floorNumber: z.number().int(),
});

const floorMeshSchema = z.object({
  floorId: z.string().min(1),
  meshName: z.string().min(1).max(120),
  projectSlug: z.string().min(1),
  districtSlug: z.string().min(1),
  buildingSlug: z.string().min(1),
});

const floorImageMappingSchema = z.object({
  floorId: z.string().min(1),
  markerX: normalized,
  markerY: normalized,
  markerLabel: z.string().min(1).max(8),
  svgPath: z.string().nullable(),
  interactionType: z.enum(["MARKER", "POLYGON", "MARKER_AND_POLYGON"]),
  projectSlug: z.string().min(1),
  districtSlug: z.string().min(1),
  buildingSlug: z.string().min(1),
});

export type ActionResult =
  | { ok: true }
  | { ok: false; error: string };

export async function saveDistrictMapping(
  input: z.infer<typeof districtMappingSchema>,
): Promise<ActionResult> {
  const parsed = districtMappingSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid mapping payload" };

  await prisma.district.update({
    where: { id: parsed.data.districtId },
    data: {
      markerX: parsed.data.markerX,
      markerY: parsed.data.markerY,
      markerLabel: parsed.data.markerLabel,
      svgPath: parsed.data.svgPath,
      interactionType: parsed.data.interactionType,
    },
  });

  revalidatePath(`/projects/${parsed.data.projectSlug}`);
  revalidatePath(`/admin/projects/${parsed.data.projectSlug}/masterplan`);
  return { ok: true };
}

export async function saveBuildingMapping(
  input: z.infer<typeof buildingMappingSchema>,
): Promise<ActionResult> {
  const parsed = buildingMappingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid mapping payload",
    };
  }

  await prisma.building.update({
    where: { id: parsed.data.buildingId },
    data: {
      markerX: parsed.data.markerX,
      markerY: parsed.data.markerY,
      markerLabel: parsed.data.markerLabel,
      svgPath: parsed.data.svgPath,
      interactionType: parsed.data.interactionType,
    },
  });

  revalidatePath(
    `/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`,
  );
  revalidatePath(
    `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`,
  );
  return { ok: true };
}

export async function saveApartmentSvgElementId(
  input: z.infer<typeof apartmentSvgSchema>,
): Promise<ActionResult> {
  const parsed = apartmentSvgSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid SVG mapping" };

  await prisma.apartment.update({
    where: { id: parsed.data.apartmentId },
    data: { svgElementId: parsed.data.svgElementId },
  });

  revalidatePath(
    `/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}/floors/${parsed.data.floorNumber}`,
  );
  return { ok: true };
}

export async function saveFloorMeshName(
  input: z.infer<typeof floorMeshSchema>,
): Promise<ActionResult> {
  const parsed = floorMeshSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid mesh mapping" };

  await prisma.floor.update({
    where: { id: parsed.data.floorId },
    data: { meshName: parsed.data.meshName },
  });

  revalidatePath(
    `/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}`,
  );
  revalidatePath(
    `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}/3d`,
  );
  return { ok: true };
}

export async function saveFloorImageMapping(
  input: z.infer<typeof floorImageMappingSchema>,
): Promise<ActionResult> {
  const parsed = floorImageMappingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid floor mapping",
    };
  }

  await prisma.floor.update({
    where: { id: parsed.data.floorId },
    data: {
      markerX: parsed.data.markerX,
      markerY: parsed.data.markerY,
      markerLabel: parsed.data.markerLabel,
      svgPath: parsed.data.svgPath,
      interactionType: parsed.data.interactionType,
    },
  });

  const publicPath = `/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}`;
  const adminPath = `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}/render`;
  revalidatePath(publicPath);
  revalidatePath(adminPath);
  return { ok: true };
}

const apartmentImageMappingSchema = z.object({
  apartmentId: z.string().min(1),
  markerX: normalized,
  markerY: normalized,
  markerLabel: z.string().min(1).max(12),
  svgPath: z.string().nullable(),
  interactionType: z.enum(["MARKER", "POLYGON", "MARKER_AND_POLYGON"]),
  projectSlug: z.string().min(1),
  districtSlug: z.string().min(1),
  buildingSlug: z.string().min(1),
  floorNumber: z.number().int(),
});

export async function saveApartmentImageMapping(
  input: z.infer<typeof apartmentImageMappingSchema>,
): Promise<ActionResult> {
  const parsed = apartmentImageMappingSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message ?? "Invalid apartment mapping",
    };
  }

  const mapping = {
    markerX: parsed.data.markerX,
    markerY: parsed.data.markerY,
    markerLabel: parsed.data.markerLabel,
    svgPath: parsed.data.svgPath,
    interactionType: parsed.data.interactionType,
  };

  const apartment = await prisma.apartment.update({
    where: { id: parsed.data.apartmentId },
    data: mapping,
    include: {
      floor: {
        include: {
          building: {
            include: { district: true },
          },
        },
      },
    },
  });

  // Same floor-plan image across buildings → keep apartment drawings in sync.
  const planUrl = apartment.floor.floorPlanPreviewUrl;
  const siblingFloors = planUrl
    ? await prisma.floor.findMany({
        where: {
          floorNumber: apartment.floor.floorNumber,
          floorPlanPreviewUrl: planUrl,
          building: { districtId: apartment.floor.building.districtId },
          NOT: { id: apartment.floorId },
        },
        include: {
          apartments: {
            where: { apartmentNumber: apartment.apartmentNumber },
            select: { id: true },
          },
          building: { select: { slug: true } },
        },
      })
    : [];

  const siblingIds = siblingFloors.flatMap((floor) =>
    floor.apartments.map((item) => item.id),
  );
  if (siblingIds.length > 0) {
    await prisma.apartment.updateMany({
      where: { id: { in: siblingIds } },
      data: mapping,
    });
  }

  const districtSlug = apartment.floor.building.district.slug;
  const projectSlug = parsed.data.projectSlug;
  const floorNumber = apartment.floor.floorNumber;

  revalidatePath(
    `/projects/${projectSlug}/districts/${districtSlug}/buildings/${apartment.floor.building.slug}/floors/${floorNumber}`,
  );
  revalidatePath(
    `/admin/projects/${projectSlug}/districts/${districtSlug}/buildings/${apartment.floor.building.slug}/floors/${floorNumber}`,
  );
  for (const floor of siblingFloors) {
    revalidatePath(
      `/projects/${projectSlug}/districts/${districtSlug}/buildings/${floor.building.slug}/floors/${floorNumber}`,
    );
    revalidatePath(
      `/admin/projects/${projectSlug}/districts/${districtSlug}/buildings/${floor.building.slug}/floors/${floorNumber}`,
    );
  }
  revalidatePath(`/apartments`);
  return { ok: true };
}
