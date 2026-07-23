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

const MAX_BYTES = 12 * 1024 * 1024;

export type UploadBuildingRenderResult =
  | { ok: true; imageUrl: string; width: number; height: number }
  | { ok: false; error: string };

export async function uploadBuildingRenderImage(input: {
  buildingId: string;
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  width: number;
  height: number;
  formData: FormData;
}): Promise<UploadBuildingRenderResult> {
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
    return { ok: false, error: "Ֆայլի չափը պետք է լինի մինչև 12MB" };
  }

  if (
    !Number.isFinite(input.width) ||
    !Number.isFinite(input.height) ||
    input.width < 32 ||
    input.height < 32
  ) {
    return { ok: false, error: "Նկարի չափերը անվավեր են" };
  }

  const building = await prisma.building.findFirst({
    where: {
      id: input.buildingId,
      slug: input.buildingSlug,
      district: {
        slug: input.districtSlug,
        project: { slug: input.projectSlug },
      },
    },
  });

  if (!building) {
    return { ok: false, error: "Շենքը չի գտնվել" };
  }

  const ext = EXT_BY_MIME[file.type] ?? "png";
  const dir = path.join(process.cwd(), "public", "uploads", "buildings");
  await mkdir(dir, { recursive: true });

  const filename = `${building.id}-${Date.now()}.${ext}`;
  const absolute = path.join(dir, filename);
  const buffer = Buffer.from(await file.arrayBuffer());
  await writeFile(absolute, buffer);

  const imageUrl = `/uploads/buildings/${filename}`;

  await prisma.building.update({
    where: { id: building.id },
    data: {
      previewImageUrl: imageUrl,
      previewImageWidth: Math.round(input.width),
      previewImageHeight: Math.round(input.height),
    },
  });

  const publicPath = `/projects/${input.projectSlug}/districts/${input.districtSlug}/buildings/${input.buildingSlug}`;
  const adminPath = `/admin/projects/${input.projectSlug}/districts/${input.districtSlug}/buildings/${input.buildingSlug}/render`;
  revalidatePath(publicPath);
  revalidatePath(adminPath);
  revalidatePath("/admin");

  return {
    ok: true,
    imageUrl,
    width: Math.round(input.width),
    height: Math.round(input.height),
  };
}
