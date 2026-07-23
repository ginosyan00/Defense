import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildingFloorMappingEditor } from "@/components/admin/BuildingFloorMappingEditor";
import { BuildingRenderImageUploader } from "@/components/admin/BuildingRenderImageUploader";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
    buildingSlug: string;
  }>;
};

const PLACEHOLDER = "/buildings/building-render.png";
const PLACEHOLDER_W = 534;
const PLACEHOLDER_H = 817;

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

  const imageUrl = building.previewImageUrl ?? PLACEHOLDER;
  const width = building.previewImageWidth ?? PLACEHOLDER_W;
  const height = building.previewImageHeight ?? PLACEHOLDER_H;
  const cacheBustedUrl = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${building.updatedAt.getTime()}`;

  return (
    <main className="space-y-6">
      <div>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← Admin
        </Link>
        <h1 className="mt-2 font-[family-name:var(--font-display)] text-3xl">
          Floor mapping · {building.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          Նախ ավելացրու շենքի նկարը, հետո գծիր հարկերը։ Գծիր → «Պահպանել
          գծագիրը» / Enter։
        </p>
      </div>

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
    </main>
  );
}

function defaultFloorMarkerY(floorNumber: number, total: number): number {
  const index = Math.max(0, Math.min(total - 1, floorNumber - 1));
  const band = 1 / Math.max(total, 1);
  return 0.12 + index * band * 0.75 + band * 0.35;
}
