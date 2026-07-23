"use server";

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const EXT_BY_MIME: Record<string, string> = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
};

const MAX_BYTES = 16 * 1024 * 1024;

export type UploadFloorPlanResult =
  | { ok: true; imageUrl: string; width: number; height: number }
  | { ok: false; error: string };

export async function uploadFloorPlanImage(input: {
  floorId: string;
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorNumber: number;
  width: number;
  height: number;
  clearApartmentPolygons: boolean;
  formData: FormData;
}): Promise<UploadFloorPlanResult> {
  const file = input.formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, error: "Ֆայլ չի ընտրվել" };
  }
  if (!ALLOWED_MIME.has(file.type)) {
    return {
      ok: false,
      error: "Թույլատրվում է PNG, JPEG, WebP, AVIF կամ SVG",
    };
  }
  if (file.size <= 0 || file.size > MAX_BYTES) {
    return { ok: false, error: "Ֆայլի չափը պետք է լինի մինչև 16MB" };
  }
  if (
    !Number.isFinite(input.width) ||
    !Number.isFinite(input.height) ||
    input.width < 32 ||
    input.height < 32
  ) {
    return { ok: false, error: "Նկարի չափերը անվավեր են" };
  }

  const floor = await prisma.floor.findFirst({
    where: {
      id: input.floorId,
      floorNumber: input.floorNumber,
      building: {
        slug: input.buildingSlug,
        district: {
          slug: input.districtSlug,
          project: { slug: input.projectSlug },
        },
      },
    },
  });

  if (!floor) {
    return { ok: false, error: "Հարկը չի գտնվել" };
  }

  const ext = EXT_BY_MIME[file.type] ?? "png";
  const dir = path.join(process.cwd(), "public", "uploads", "floors");
  await mkdir(dir, { recursive: true });
  const filename = `${floor.id}-${Date.now()}.${ext}`;
  await writeFile(
    path.join(dir, filename),
    Buffer.from(await file.arrayBuffer()),
  );
  const imageUrl = `/uploads/floors/${filename}`;
  const width = Math.round(input.width);
  const height = Math.round(input.height);

  await prisma.floor.update({
    where: { id: floor.id },
    data: {
      floorPlanPreviewUrl: imageUrl,
      floorPlanImageWidth: width,
      floorPlanImageHeight: height,
    },
  });

  if (input.clearApartmentPolygons) {
    await prisma.apartment.updateMany({
      where: { floorId: floor.id },
      data: { svgPath: null },
    });
  }

  const publicPath = `/projects/${input.projectSlug}/districts/${input.districtSlug}/buildings/${input.buildingSlug}/floors/${input.floorNumber}`;
  const adminPath = `/admin/projects/${input.projectSlug}/districts/${input.districtSlug}/buildings/${input.buildingSlug}/floors/${input.floorNumber}`;
  revalidatePath(publicPath);
  revalidatePath(adminPath);

  return { ok: true, imageUrl, width, height };
}
