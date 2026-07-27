"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { storeMediaFile } from "@/lib/media/store-media";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const MAX_BYTES = 12 * 1024 * 1024;
const MAX_FLOORS = 60;

export type SetupBuildingFloorsResult =
  | { ok: true; href: string; floorCount: number }
  | { ok: false; error: string };

export async function setupBuildingFloorsAndRender(input: {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorCount: number;
  width?: number;
  height?: number;
  formData: FormData;
}): Promise<SetupBuildingFloorsResult> {
  const parsed = z
    .object({
      projectSlug: z.string().min(1),
      districtSlug: z.string().min(1),
      buildingSlug: z.string().min(1),
      floorCount: z.number().int().min(1).max(MAX_FLOORS),
    })
    .safeParse({
      projectSlug: input.projectSlug,
      districtSlug: input.districtSlug,
      buildingSlug: input.buildingSlug,
      floorCount: input.floorCount,
    });

  if (!parsed.success) {
    return {
      ok: false,
      error: `Հարկերի քանակը պետք է լինի 1–${MAX_FLOORS}։`,
    };
  }

  const building = await prisma.building.findFirst({
    where: {
      slug: parsed.data.buildingSlug,
      district: {
        slug: parsed.data.districtSlug,
        project: { slug: parsed.data.projectSlug },
      },
    },
    include: {
      floors: {
        orderBy: { floorNumber: "asc" },
        include: { _count: { select: { apartments: true } } },
      },
    },
  });

  if (!building) {
    return { ok: false, error: "Շենքը չի գտնվել։" };
  }

  const file = input.formData.get("file");
  const hasNewFile = file instanceof File && file.size > 0;
  const hasExistingImage = Boolean(building.previewImageUrl);

  if (!hasNewFile && !hasExistingImage) {
    return { ok: false, error: "Ավելացրու շենքի նկարը։" };
  }

  let previewImageUrl = building.previewImageUrl;
  let previewImageWidth = building.previewImageWidth;
  let previewImageHeight = building.previewImageHeight;

  if (hasNewFile) {
    if (!(file instanceof File)) {
      return { ok: false, error: "Ֆայլ չի ընտրվել։" };
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return {
        ok: false,
        error: "Թույլատրվում է PNG, JPEG, WebP, AVIF կամ SVG։",
      };
    }
    if (file.size > MAX_BYTES) {
      return { ok: false, error: "Ֆայլի չափը պետք է լինի մինչև 12MB։" };
    }
    const width = input.width;
    const height = input.height;
    if (
      !Number.isFinite(width) ||
      !Number.isFinite(height) ||
      (width ?? 0) < 32 ||
      (height ?? 0) < 32
    ) {
      return { ok: false, error: "Նկարի չափերը անվավեր են։" };
    }

    const media = await storeMediaFile(file);
    previewImageUrl = media.url;
    previewImageWidth = Math.round(width!);
    previewImageHeight = Math.round(height!);
  }

  const targetCount = parsed.data.floorCount;
  const existingByNumber = new Map(
    building.floors.map((floor) => [floor.floorNumber, floor]),
  );

  const toCreate: number[] = [];
  for (let n = 1; n <= targetCount; n += 1) {
    if (!existingByNumber.has(n)) toCreate.push(n);
  }

  const toDelete = building.floors.filter((floor) => {
    if (floor.floorNumber <= targetCount) return false;
    const hasWork =
      floor._count.apartments > 0 ||
      floor.markerX != null ||
      Boolean(floor.svgPath) ||
      Boolean(floor.floorPlanPreviewUrl);
    return !hasWork;
  });

  const blockedExtras = building.floors.filter(
    (floor) =>
      floor.floorNumber > targetCount &&
      !toDelete.some((row) => row.id === floor.id),
  );

  await prisma.$transaction(async (tx) => {
    if (toDelete.length > 0) {
      await tx.floor.deleteMany({
        where: { id: { in: toDelete.map((floor) => floor.id) } },
      });
    }

    if (toCreate.length > 0) {
      await tx.floor.createMany({
        data: toCreate.map((floorNumber) => ({
          buildingId: building.id,
          floorNumber,
          name: `Հարկ ${floorNumber}`,
          meshName: `Floor_${String(floorNumber).padStart(2, "0")}`,
          sortOrder: floorNumber,
        })),
      });
    }

    await tx.building.update({
      where: { id: building.id },
      data: {
        previewImageUrl,
        previewImageWidth,
        previewImageHeight,
      },
    });
  });

  const href = `/admin/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}/render`;
  revalidatePath(`/admin/projects/${parsed.data.projectSlug}`);
  revalidatePath(href);
  revalidatePath(
    `/projects/${parsed.data.projectSlug}/districts/${parsed.data.districtSlug}/buildings/${parsed.data.buildingSlug}`,
  );

  if (blockedExtras.length > 0) {
    return {
      ok: true,
      href,
      floorCount: targetCount + blockedExtras.length,
    };
  }

  return { ok: true, href, floorCount: targetCount };
}
