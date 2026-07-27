import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminBuildingFloorUploadPicker } from "@/components/admin/AdminBuildingFloorUploadPicker";
import { FloorApartmentMappingEditor } from "@/components/admin/FloorApartmentMappingEditor";
import { FloorPlanImageUploader } from "@/components/admin/FloorPlanImageUploader";
import { getBuildingRenderPayload } from "@/lib/building/get-building-render";
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

  const renderPayload = await getBuildingRenderPayload(
    projectSlug,
    districtSlug,
    buildingSlug,
  );

  const hasRealFloorPlan = Boolean(floor.floorPlanPreviewUrl);
  const imageUrl = floor.floorPlanPreviewUrl ?? PLACEHOLDER;
  const width = floor.floorPlanImageWidth ?? PLACEHOLDER_W;
  const height = floor.floorPlanImageHeight ?? PLACEHOLDER_H;
  const cacheBusted = `${imageUrl}${imageUrl.includes("?") ? "&" : "?"}v=${floor.updatedAt.getTime()}`;
  const publicFloorHref = `/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}/floors/${number}`;
  const publicBuildingHref = `/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}`;

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
          Սեղմիր նարնջագույն հարկի վրա → բացվում է նկարի upload։ Upload-ից հետո
          ներքևում գծիր բնակարանները։
        </p>
        <p className="mt-3 flex flex-wrap gap-4">
          <Link
            href={publicBuildingHref}
            className="text-sm underline-offset-4 hover:underline"
            target="_blank"
          >
            Public շենք →
          </Link>
          <Link
            href={publicFloorHref}
            className="text-sm underline-offset-4 hover:underline"
            target="_blank"
          >
            Public հատակագիծ → {floor.name}
          </Link>
        </p>
      </div>

      {renderPayload ? (
        <section className="space-y-2" id="building-preview">
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Շենքի նկար · սեղմիր հարկը upload-ի համար
          </h2>
          <AdminBuildingFloorUploadPicker
            projectSlug={projectSlug}
            districtSlug={districtSlug}
            buildingSlug={buildingSlug}
            currentFloorNumber={number}
            currentFloorId={floor.id}
            imageUrl={renderPayload.building.imageUrl}
            imageWidth={renderPayload.building.imageWidth}
            imageHeight={renderPayload.building.imageHeight}
            viewBox={renderPayload.building.viewBox}
            buildingName={renderPayload.building.name}
            floors={renderPayload.floors}
          />
        </section>
      ) : null}

      <section className="space-y-2" id="floor-plan">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          {floor.name} · հատակագիծ / բնակարաններ
        </h2>
        <FloorPlanImageUploader
          floorId={floor.id}
          projectSlug={projectSlug}
          districtSlug={districtSlug}
          buildingSlug={buildingSlug}
          floorNumber={number}
          currentImageUrl={hasRealFloorPlan ? cacheBusted : null}
        />

        {hasRealFloorPlan ? (
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
        ) : (
          <p className="border border-amber-700/30 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Նախ upload արա հատակագծի նկարը (վերևի նարնջագույն գոտի → Click կամ
            «Ավելացնել / փոխել նկար»), հետո կբացվի բնակարաններ գծելու տեղը։
          </p>
        )}
      </section>
    </main>
  );
}
