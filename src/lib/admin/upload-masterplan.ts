"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { storeMediaFile } from "@/lib/media/store-media";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/avif",
  "image/svg+xml",
]);

const MAX_BYTES = 16 * 1024 * 1024;

export type UploadMasterplanImageResult =
  | { ok: true; imageUrl: string; width: number; height: number }
  | { ok: false; error: string };

export async function uploadMasterplanImage(input: {
  projectId: string;
  projectSlug: string;
  width: number;
  height: number;
  clearDistrictPolygons: boolean;
  formData: FormData;
}): Promise<UploadMasterplanImageResult> {
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

  const project = await prisma.project.findFirst({
    where: { id: input.projectId, slug: input.projectSlug },
    include: {
      masterplanAssets: {
        where: { variant: "DESKTOP", districtId: null },
        take: 1,
      },
    },
  });

  if (!project) {
    return { ok: false, error: "Նախագիծը չի գտնվել" };
  }

  const media = await storeMediaFile(file);
  const imageUrl = media.url;
  const width = Math.round(input.width);
  const height = Math.round(input.height);
  const viewBox = `0 0 ${width} ${height}`;

  const existing = project.masterplanAssets[0];
  if (existing) {
    await prisma.masterplanAsset.update({
      where: { id: existing.id },
      data: {
        imageUrl,
        mobileImageUrl: imageUrl,
        width,
        height,
        viewBox,
      },
    });
  } else {
    await prisma.masterplanAsset.create({
      data: {
        projectId: project.id,
        variant: "DESKTOP",
        imageUrl,
        mobileImageUrl: imageUrl,
        width,
        height,
        viewBox,
      },
    });
  }

  if (input.clearDistrictPolygons) {
    await prisma.district.updateMany({
      where: { projectId: project.id },
      data: { svgPath: null },
    });
  }

  revalidatePath(`/projects/${input.projectSlug}`);
  revalidatePath(`/admin/projects/${input.projectSlug}`);
  revalidatePath(`/admin/projects/${input.projectSlug}/masterplan`);
  revalidatePath("/admin");

  return { ok: true, imageUrl, width, height };
}
