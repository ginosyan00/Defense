import Link from "next/link";
import { notFound } from "next/navigation";
import { DistrictBuildingEditor } from "@/components/admin/DistrictBuildingEditor";
import { DistrictPlanImageUploader } from "@/components/admin/DistrictPlanImageUploader";
import { getDistrictPlaceholderAsset } from "@/lib/district/placeholder-asset";
import { formatMarkerLabel } from "@/lib/format-marker-label";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ projectSlug: string; districtSlug: string }>;
};

export default async function AdminDistrictEditorPage({ params }: PageProps) {
  const { projectSlug, districtSlug } = await params;
  const district = await prisma.district.findFirst({
    where: {
      slug: districtSlug,
      project: { slug: projectSlug },
    },
    include: {
      project: true,
      masterplanAssets: {
        where: { variant: "DESKTOP" },
        take: 1,
      },
      buildings: {
        where: { status: { not: "HIDDEN" } },
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  if (!district) notFound();

  const asset = district.masterplanAssets[0];
  const placeholder = getDistrictPlaceholderAsset(districtSlug);
  const imageUrl = asset?.imageUrl ?? placeholder.imageUrl;
  const width = asset?.width ?? placeholder.width;
  const height = asset?.height ?? placeholder.height;
  const viewBox = asset?.viewBox ?? placeholder.viewBox;
  const [viewW, viewH] = parseViewBox(viewBox, width, height);
  const cacheBusted = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${district.updatedAt.getTime()}`;

  return (
    <main className="space-y-6">
      <div>
        <Link
          href={`/admin/projects/${projectSlug}`}
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← {district.project.name}
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Building editor · {district.name}
        </h1>
        <p className="mt-1 text-sm text-[var(--mp-ink-muted)]">
          {district.project.name} · թաղամասի aerial նկարի վրա գծիր շենքերը
        </p>
      </div>

      <DistrictPlanImageUploader
        districtId={district.id}
        projectSlug={projectSlug}
        districtSlug={districtSlug}
        currentImageUrl={cacheBusted}
      />

      <DistrictBuildingEditor
        projectSlug={projectSlug}
        districtSlug={districtSlug}
        imageUrl={cacheBusted}
        imageWidth={width}
        imageHeight={height}
        viewBoxWidth={viewW}
        viewBoxHeight={viewH}
        initialBuildings={district.buildings.map((building) => ({
          id: building.id,
          label: formatMarkerLabel(
            building.markerLabel ?? building.buildingNumber,
          ),
          title: building.name,
          markerX: building.markerX,
          markerY: building.markerY,
          svgPath: building.svgPath,
          interactionType: building.interactionType,
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
    return [parts[2]!, parts[3]!];
  }
  return [fallbackW, fallbackH];
}
