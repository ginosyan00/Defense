import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildingFloorMappingEditor } from "@/components/admin/BuildingFloorMappingEditor";
import { BuildingFloorSetupForm } from "@/components/admin/BuildingFloorSetupForm";
import { BuildingRenderImageUploader } from "@/components/admin/BuildingRenderImageUploader";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
    buildingSlug: string;
  }>;
};

export default async function AdminBuildingRenderMappingPage({
  params,
}: PageProps) {
  const { projectSlug, districtSlug, buildingSlug } = await params;

  const building = await prisma.building.findFirst({
    where: {
      slug: buildingSlug,
      district: {
        slug: districtSlug,
        project: { slug: projectSlug },
      },
    },
    include: {
      floors: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!building) notFound();

  const hasImage = Boolean(building.previewImageUrl);
  const imageUrl = building.previewImageUrl;
  const width = building.previewImageWidth ?? 0;
  const height = building.previewImageHeight ?? 0;
  const cacheBustedUrl =
    hasImage && imageUrl
      ? `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${building.updatedAt.getTime()}`
      : null;

  return (
    <main className="space-y-6">
      <div>
        <Link
          href={`/admin/projects/${projectSlug}`}
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← Նախագիծ
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Floor mapping · {building.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          {hasImage
            ? "Գծիր հարկերը նկարի վրա → Պահպանել։"
            : "Նախ գրիր հարկերի քանակը և upload արա շենքի նկարը։"}
        </p>
      </div>

      {!hasImage || building.floors.length === 0 ? (
        <BuildingFloorSetupForm
          projectSlug={projectSlug}
          districtSlug={districtSlug}
          buildingSlug={buildingSlug}
          buildingName={building.name}
          initialFloorCount={Math.max(building.floors.length, 1)}
          hasImage={hasImage}
        />
      ) : null}

      {hasImage && cacheBustedUrl && width > 0 && height > 0 ? (
        <>
          <BuildingRenderImageUploader
            buildingId={building.id}
            projectSlug={projectSlug}
            districtSlug={districtSlug}
            buildingSlug={buildingSlug}
            currentImageUrl={cacheBustedUrl}
          />

          <BuildingFloorMappingEditor
            key={cacheBustedUrl}
            projectSlug={projectSlug}
            districtSlug={districtSlug}
            buildingSlug={buildingSlug}
            imageUrl={cacheBustedUrl}
            imageWidth={width}
            imageHeight={height}
            viewBoxWidth={width}
            viewBoxHeight={height}
            initialFloors={building.floors.map((floor) => ({
              id: floor.id,
              label:
                floor.markerLabel ??
                String(floor.floorNumber).padStart(2, "0"),
              title: floor.name,
              floorNumber: floor.floorNumber,
              markerX: floor.markerX ?? 0.5,
              markerY:
                floor.markerY ??
                defaultFloorMarkerY(floor.floorNumber, building.floors.length),
              svgPath: floor.svgPath,
              interactionType: floor.interactionType,
            }))}
          />
        </>
      ) : null}
    </main>
  );
}

function defaultFloorMarkerY(floorNumber: number, total: number): number {
  // Floor 1 at the bottom of the facade; highest floor near the top.
  const indexFromTop = Math.max(0, total - floorNumber);
  const band = 1 / Math.max(total, 1);
  return 0.12 + indexFromTop * band * 0.75 + band * 0.35;
}
