import Link from "next/link";
import { notFound } from "next/navigation";
import { FloorApartmentMappingEditor } from "@/components/admin/FloorApartmentMappingEditor";
import { FloorPlanImageUploader } from "@/components/admin/FloorPlanImageUploader";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
    buildingSlug: string;
    floorNumber: string;
  }>;
};

const PLACEHOLDER = "/floor-plans/typical-floor-plan.png";
const PLACEHOLDER_W = 1024;
const PLACEHOLDER_H = 512;

export default async function AdminFloorApartmentMapPage({ params }: PageProps) {
  const { projectSlug, districtSlug, buildingSlug, floorNumber } = await params;
  const number = Number(floorNumber);
  if (!Number.isFinite(number)) notFound();

  const floor = await prisma.floor.findFirst({
    where: {
      floorNumber: number,
      building: {
        slug: buildingSlug,
        district: {
          slug: districtSlug,
          project: { slug: projectSlug },
        },
      },
    },
    include: {
      apartments: { orderBy: { apartmentNumber: "asc" } },
      building: true,
    },
  });

  if (!floor) notFound();

  const imageUrl = floor.floorPlanPreviewUrl ?? PLACEHOLDER;
  const width = floor.floorPlanImageWidth ?? PLACEHOLDER_W;
  const height = floor.floorPlanImageHeight ?? PLACEHOLDER_H;
  const cacheBusted = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${floor.updatedAt.getTime()}`;

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
          Apartment mapping · {floor.building.name} · {floor.name}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          Ընտրիր բնակարան → Polygon → գծիր (≥3 կետ) → «Պահպանել գծագիրը» /
          Enter։ Նույն հատակագիծ ունեցող մյուս շենքերին ավտոմատ կկիրառվի։
        </p>
        <p className="mt-3">
          <Link
            href={`/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}/floors/${number}`}
            className="text-sm underline-offset-4 hover:underline"
            target="_blank"
          >
            Դիտել public էջը → {floor.building.name} · {floor.name}
          </Link>
        </p>
      </div>

      <FloorPlanImageUploader
        floorId={floor.id}
        projectSlug={projectSlug}
        districtSlug={districtSlug}
        buildingSlug={buildingSlug}
        floorNumber={number}
        currentImageUrl={cacheBusted}
      />

      <FloorApartmentMappingEditor
        key={cacheBusted}
        projectSlug={projectSlug}
        districtSlug={districtSlug}
        buildingSlug={buildingSlug}
        floorNumber={number}
        imageUrl={cacheBusted}
        imageWidth={width}
        imageHeight={height}
        viewBoxWidth={width}
        viewBoxHeight={height}
        initialApartments={floor.apartments.map((apartment, index) => ({
          id: apartment.id,
          label:
            apartment.markerLabel ?? apartment.apartmentNumber.slice(0, 8),
          title: `Բնակարան ${apartment.apartmentNumber}`,
          apartmentNumber: apartment.apartmentNumber,
          status: apartment.status,
          rooms: apartment.rooms,
          totalArea: apartment.totalArea,
          price: apartment.price,
          currency: apartment.currency,
          markerX: apartment.markerX ?? 0.25 + (index % 2) * 0.5,
          markerY: apartment.markerY ?? 0.3 + Math.floor(index / 2) * 0.4,
          svgPath: apartment.svgPath,
          interactionType: apartment.interactionType,
        }))}
      />
    </main>
  );
}
