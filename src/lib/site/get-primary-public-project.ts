import { prisma } from "@/lib/db";

export type PrimaryPublicProject = {
  slug: string;
  name: string;
  description: string;
  location: string;
};

const PREFERRED_SLUG = "north-yard";

/**
 * Public site entry project: prefer the mapped North Yard project,
 * else the newest project with a real uploaded masterplan image.
 */
export async function getPrimaryPublicProject(): Promise<PrimaryPublicProject | null> {
  const preferred = await prisma.project.findUnique({
    where: { slug: PREFERRED_SLUG },
    select: {
      slug: true,
      name: true,
      description: true,
      location: true,
      masterplanAssets: {
        where: { variant: "DESKTOP", districtId: null },
        select: { imageUrl: true },
        take: 1,
      },
    },
  });

  if (
    preferred?.masterplanAssets[0]?.imageUrl.startsWith("/api/media/") ||
    preferred?.masterplanAssets[0]?.imageUrl.startsWith("/uploads/")
  ) {
    return {
      slug: preferred.slug,
      name: preferred.name,
      description: preferred.description,
      location: preferred.location,
    };
  }

  const withUpload = await prisma.project.findFirst({
    where: {
      masterplanAssets: {
        some: {
          variant: "DESKTOP",
          districtId: null,
          OR: [
            { imageUrl: { startsWith: "/api/media/" } },
            { imageUrl: { startsWith: "/uploads/" } },
          ],
        },
      },
    },
    orderBy: { updatedAt: "desc" },
    select: {
      slug: true,
      name: true,
      description: true,
      location: true,
    },
  });

  if (withUpload) return withUpload;

  if (preferred) {
    return {
      slug: preferred.slug,
      name: preferred.name,
      description: preferred.description,
      location: preferred.location,
    };
  }

  return prisma.project.findFirst({
    orderBy: { createdAt: "asc" },
    select: {
      slug: true,
      name: true,
      description: true,
      location: true,
    },
  });
}

export function masterplanPath(projectSlug: string): string {
  return `/projects/${projectSlug}`;
}
