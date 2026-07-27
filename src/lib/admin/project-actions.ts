"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { formatMarkerLabel } from "@/lib/format-marker-label";

function slugify(name: string): string {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  return base || `item-${Date.now().toString(36)}`;
}

async function uniqueProjectSlug(base: string): Promise<string> {
  let slug = base;
  let i = 2;
  while (await prisma.project.findUnique({ where: { slug } })) {
    slug = `${base}-${i}`;
    i += 1;
  }
  return slug;
}

export type CreateResult =
  | { ok: true; href: string }
  | { ok: false; error: string };

export async function createProject(input: {
  name: string;
  location?: string;
}): Promise<CreateResult> {
  const parsed = z
    .object({
      name: z.string().trim().min(2).max(120),
      location: z.string().trim().max(160).optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Գրիր նախագծի անունը (առնվազն 2 նիշ)։" };
  }

  const slug = await uniqueProjectSlug(slugify(parsed.data.name));
  const location = parsed.data.location || "Yerevan, Armenia";

  const project = await prisma.project.create({
    data: {
      name: parsed.data.name,
      slug,
      description: `${parsed.data.name}՝ ինտերակտիվ masterplan նախագիծ։`,
      location,
      status: "DRAFT",
      masterplanAssets: {
        create: {
          variant: "DESKTOP",
          imageUrl: "/masterplans/placeholder-aerial.svg",
          mobileImageUrl: "/masterplans/placeholder-aerial.svg",
          width: 2400,
          height: 1600,
          viewBox: "0 0 2400 1600",
          initialZoom: 1,
          minZoom: 1,
          maxZoom: 4,
        },
      },
    },
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/projects/${project.slug}`);
  return { ok: true, href: `/admin/projects/${project.slug}` };
}

export async function createDistrict(input: {
  projectSlug: string;
  name: string;
  markerLabel?: string;
}): Promise<CreateResult> {
  const parsed = z
    .object({
      projectSlug: z.string().min(1),
      name: z.string().trim().min(1).max(120),
      markerLabel: z.string().trim().max(8).optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Թաղամասի անունը պարտադիր է։" };
  }

  const project = await prisma.project.findUnique({
    where: { slug: parsed.data.projectSlug },
    include: { districts: { select: { sortOrder: true } } },
  });
  if (!project) return { ok: false, error: "Նախագիծը չի գտնվել։" };

  const baseSlug = slugify(parsed.data.name);
  let slug = baseSlug;
  let n = 2;
  while (
    await prisma.district.findUnique({
      where: { projectId_slug: { projectId: project.id, slug } },
    })
  ) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }

  const sortOrder =
    (project.districts.reduce((m, d) => Math.max(m, d.sortOrder), 0) || 0) + 1;
  const label =
    parsed.data.markerLabel ||
    parsed.data.name.slice(0, 1).toUpperCase() ||
    String(sortOrder);

  await prisma.district.create({
    data: {
      projectId: project.id,
      name: parsed.data.name,
      slug,
      description: `${parsed.data.name} թաղամաս։`,
      svgElementId: `district-${slug}`,
      markerLabel: label,
      markerX: null,
      markerY: null,
      sortOrder,
      status: "AVAILABLE",
      interactionType: "MARKER_AND_POLYGON",
    },
  });

  revalidatePath(`/admin/projects/${project.slug}`);
  revalidatePath(`/admin/projects/${project.slug}/masterplan`);
  revalidatePath(`/projects/${project.slug}`);
  return {
    ok: true,
    href: `/admin/projects/${project.slug}/masterplan`,
  };
}

export async function createBuilding(input: {
  projectSlug: string;
  districtSlug: string;
  name: string;
  buildingNumber?: string;
}): Promise<CreateResult> {
  const parsed = z
    .object({
      projectSlug: z.string().min(1),
      districtSlug: z.string().min(1),
      name: z.string().trim().min(1).max(120),
      buildingNumber: z.string().trim().max(12).optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Շենքի անունը պարտադիր է։" };
  }

  const district = await prisma.district.findFirst({
    where: {
      slug: parsed.data.districtSlug,
      project: { slug: parsed.data.projectSlug },
    },
    include: { buildings: { select: { sortOrder: true, buildingNumber: true } } },
  });
  if (!district) return { ok: false, error: "Թաղամասը չի գտնվել։" };

  const sortOrder =
    (district.buildings.reduce((m, b) => Math.max(m, b.sortOrder), 0) || 0) + 1;
  const rawNumber =
    parsed.data.buildingNumber || String(sortOrder);
  const buildingNumber = formatMarkerLabel(rawNumber);
  const baseSlug = slugify(parsed.data.name) || `b${sortOrder}`;
  let slug = baseSlug;
  let n = 2;
  while (
    await prisma.building.findUnique({
      where: { districtId_slug: { districtId: district.id, slug } },
    })
  ) {
    slug = `${baseSlug}-${n}`;
    n += 1;
  }

  await prisma.building.create({
    data: {
      districtId: district.id,
      name: parsed.data.name,
      slug,
      buildingNumber,
      description: `${parsed.data.name}՝ շենք։`,
      svgElementId: `building-${slug}`,
      markerLabel: buildingNumber,
      markerX: null,
      markerY: null,
      sortOrder,
      status: "UNDER_CONSTRUCTION",
      interactionType: "MARKER_AND_POLYGON",
      // Floors are created in Phase 3 (count + render image setup).
    },
  });

  revalidatePath(`/admin/projects/${parsed.data.projectSlug}`);
  revalidatePath(
    `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`,
  );
  revalidatePath(`/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`);
  return {
    ok: true,
    href: `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`,
  };
}

export async function deleteDistrict(input: {
  districtId: string;
  projectSlug: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z
    .object({
      districtId: z.string().min(1),
      projectSlug: z.string().min(1),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid district delete" };

  const district = await prisma.district.findFirst({
    where: {
      id: parsed.data.districtId,
      project: { slug: parsed.data.projectSlug },
    },
    select: { id: true },
  });
  if (!district) return { ok: false, error: "Թաղամասը չի գտնվել։" };

  await prisma.district.delete({ where: { id: district.id } });

  revalidatePath(`/admin/projects/${parsed.data.projectSlug}`);
  revalidatePath(`/admin/projects/${parsed.data.projectSlug}/masterplan`);
  revalidatePath(`/projects/${parsed.data.projectSlug}`);
  revalidatePath("/");
  return { ok: true };
}

export async function deleteBuilding(input: {
  buildingId: string;
  projectSlug: string;
  districtSlug: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const parsed = z
    .object({
      buildingId: z.string().min(1),
      projectSlug: z.string().min(1),
      districtSlug: z.string().min(1),
    })
    .safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid building delete" };

  const building = await prisma.building.findFirst({
    where: {
      id: parsed.data.buildingId,
      district: {
        slug: parsed.data.districtSlug,
        project: { slug: parsed.data.projectSlug },
      },
    },
    select: { id: true },
  });
  if (!building) return { ok: false, error: "Շենքը չի գտնվել։" };

  await prisma.building.delete({ where: { id: building.id } });

  revalidatePath(`/admin/projects/${parsed.data.projectSlug}`);
  revalidatePath(
    `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`,
  );
  revalidatePath(
    `/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}`,
  );
  return { ok: true };
}

export async function createFloor(input: {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  name?: string;
}): Promise<CreateResult> {
  const parsed = z
    .object({
      projectSlug: z.string().min(1),
      districtSlug: z.string().min(1),
      buildingSlug: z.string().min(1),
      name: z.string().trim().max(80).optional(),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Շենքը չի գտնվել։" };
  }

  const building = await prisma.building.findFirst({
    where: {
      slug: parsed.data.buildingSlug,
      district: {
        slug: parsed.data.districtSlug,
        project: { slug: parsed.data.projectSlug },
      },
    },
    include: { floors: { select: { floorNumber: true } } },
  });
  if (!building) return { ok: false, error: "Շենքը չի գտնվել։" };

  const floorNumber =
    (building.floors.reduce((m, f) => Math.max(m, f.floorNumber), 0) || 0) + 1;

  await prisma.floor.create({
    data: {
      buildingId: building.id,
      floorNumber,
      name: parsed.data.name || `Հարկ ${floorNumber}`,
      meshName: `Floor_${String(floorNumber).padStart(2, "0")}`,
      sortOrder: floorNumber,
    },
  });

  const href = `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}/render`;
  revalidatePath(`/admin/projects/${parsed.data.projectSlug}`);
  revalidatePath(href);
  return { ok: true, href };
}

export async function createApartment(input: {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorNumber: number;
  apartmentNumber: string;
}): Promise<CreateResult> {
  const parsed = z
    .object({
      projectSlug: z.string().min(1),
      districtSlug: z.string().min(1),
      buildingSlug: z.string().min(1),
      floorNumber: z.number().int().positive(),
      apartmentNumber: z.string().trim().min(1).max(20),
    })
    .safeParse(input);

  if (!parsed.success) {
    return { ok: false, error: "Բնակարանի համարը պարտադիր է։" };
  }

  const floor = await prisma.floor.findFirst({
    where: {
      floorNumber: parsed.data.floorNumber,
      building: {
        slug: parsed.data.buildingSlug,
        district: {
          slug: parsed.data.districtSlug,
          project: { slug: parsed.data.projectSlug },
        },
      },
    },
  });
  if (!floor) return { ok: false, error: "Հարկը չի գտնվել։" };

  const slugBase = slugify(
    `${parsed.data.buildingSlug}-${parsed.data.apartmentNumber}`,
  );
  let slug = slugBase;
  let n = 2;
  while (await prisma.apartment.findUnique({ where: { slug } })) {
    slug = `${slugBase}-${n}`;
    n += 1;
  }

  await prisma.apartment.create({
    data: {
      floorId: floor.id,
      slug,
      apartmentNumber: parsed.data.apartmentNumber,
      svgElementId: `apt-${slug}`,
      rooms: 2,
      bedrooms: 1,
      bathrooms: 1,
      balconies: 1,
      totalArea: 65,
      livingArea: 52,
      balconyArea: 6,
      ceilingHeight: 2.8,
      price: 65000000,
      pricePerSquareMeter: 1000000,
      currency: "AMD",
      status: "AVAILABLE",
    },
  });

  const href = `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}/floors/${parsed.data.floorNumber}`;
  revalidatePath(`/admin/projects/${parsed.data.projectSlug}`);
  revalidatePath(href);
  return { ok: true, href };
}
