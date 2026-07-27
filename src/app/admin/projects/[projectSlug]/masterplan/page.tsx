import Link from "next/link";
import { notFound } from "next/navigation";
import { MasterplanImageUploader } from "@/components/admin/MasterplanImageUploader";
import { MasterplanMappingEditor } from "@/components/admin/MasterplanMappingEditor";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ projectSlug: string }>;
};

export default async function AdminMasterplanPage({ params }: PageProps) {
  const { projectSlug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      masterplanAssets: {
        where: { variant: "DESKTOP", districtId: null },
        take: 1,
      },
      districts: {
        where: { status: { not: "HIDDEN" } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!project) notFound();
  const asset = project.masterplanAssets[0];
  if (!asset) notFound();

  const [viewW, viewH] = parseViewBox(asset.viewBox, asset.width, asset.height);
  const cacheBusted = `${asset.imageUrl}${asset.imageUrl.includes("?") ? "&" : "?"}v=${asset.updatedAt.getTime()}`;

  return (
    <main className="space-y-6">
      <div>
        <Link
          href={`/admin/projects/${project.slug}`}
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← {project.name}
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Masterplan editor · {project.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          Նախ ավելացրու masterplan նկարը, հետո տեղադրիր թաղամասերի marker /
          polygon։
        </p>
      </div>

      <MasterplanImageUploader
        projectId={project.id}
        projectSlug={project.slug}
        currentImageUrl={cacheBusted}
      />

      <MasterplanMappingEditor
        projectSlug={project.slug}
        imageUrl={cacheBusted}
        imageWidth={asset.width}
        imageHeight={asset.height}
        viewBoxWidth={viewW}
        viewBoxHeight={viewH}
        initialDistricts={project.districts.map((district) => ({
          id: district.id,
          label: district.markerLabel ?? district.name.slice(0, 1),
          title: district.name,
          markerX: district.markerX,
          markerY: district.markerY,
          svgPath: district.svgPath,
          interactionType: district.interactionType,
        }))}
      />
    </main>
  );
}

function parseViewBox(
  viewBox: string,
  fallbackW: number,
  fallbackH: number,
): [number, number] {
  const parts = viewBox.trim().split(/\s+/).map(Number);
  if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
    return [parts[2], parts[3]];
  }
  return [fallbackW, fallbackH];
}
