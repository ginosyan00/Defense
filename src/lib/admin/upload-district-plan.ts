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

export type UploadDistrictImageResult =
  | { ok: true; imageUrl: string; width: number; height: number }
  | { ok: false; error: string };

export async function uploadDistrictPlanImage(input: {
  districtId: string;
  projectSlug: string;
  districtSlug: string;
  width: number;
  height: number;
  clearBuildingPolygons: boolean;
  formData: FormData;
}): Promise<UploadDistrictImageResult> {
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

  const district = await prisma.district.findFirst({
    where: {
      id: input.districtId,
      slug: input.districtSlug,
      project: { slug: input.projectSlug },
    },
    include: {
      masterplanAssets: {
        where: { variant: "DESKTOP" },
        take: 1,
      },
    },
  });

  if (!district) {
    return { ok: false, error: "Թաղամասը չի գտնվել" };
  }

  const ext = EXT_BY_MIME[file.type] ?? "png";
  const dir = path.join(process.cwd(), "public", "uploads", "districts");
  await mkdir(dir, { recursive: true });
  const filename = `${district.id}-${Date.now()}.${ext}`;
  await writeFile(
    path.join(dir, filename),
    Buffer.from(await file.arrayBuffer()),
  );
  const imageUrl = `/uploads/districts/${filename}`;
  const width = Math.round(input.width);
  const height = Math.round(input.height);
  const viewBox = `0 0 ${width} ${height}`;

  const existing = district.masterplanAssets[0];
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
        districtId: district.id,
        variant: "DESKTOP",
        imageUrl,
        mobileImageUrl: imageUrl,
        width,
        height,
        viewBox,
      },
    });
  }

  if (input.clearBuildingPolygons) {
    await prisma.building.updateMany({
      where: { districtId: district.id },
      data: { svgPath: null },
    });
  }

  revalidatePath(
    `/projects/${input.projectSlug}/districts/${input.districtSlug}`,
  );
  revalidatePath(
    `/admin/projects/${input.projectSlug}/districts/${input.districtSlug}`,
  );
  revalidatePath("/admin");

  return { ok: true, imageUrl, width, height };
}
