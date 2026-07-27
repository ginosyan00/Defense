import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { BuildingRenderViewer } from "@/components/building/BuildingRenderViewer";
import { Building3DViewerLazy } from "@/components/building-3d/Building3DViewerLazy";
import { PageHero } from "@/components/site/PageHero";
import { getBuilding3DPayload } from "@/lib/building/get-building-3d";
import { getBuildingRenderPayload } from "@/lib/building/get-building-render";
import { prisma } from "@/lib/db";

type BuildingPageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
    buildingSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: BuildingPageProps): Promise<Metadata> {
  const { projectSlug, districtSlug, buildingSlug } = await params;
  const building = await prisma.building.findFirst({
    where: {
      slug: buildingSlug,
      district: {
        slug: districtSlug,
        project: { slug: projectSlug },
      },
    },
  });
  if (!building) return { title: "Building not found" };
  return {
    title: `${building.name} · Building`,
    description: building.description,
  };
}

export default async function BuildingPage({ params }: BuildingPageProps) {
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
      district: { include: { project: true } },
      floors: { orderBy: { sortOrder: "asc" } },
    },
  });

  if (!building) notFound();

  const [payload3d, renderPayload] = await Promise.all([
    getBuilding3DPayload(projectSlug, districtSlug, buildingSlug),
    getBuildingRenderPayload(projectSlug, districtSlug, buildingSlug),
  ]);

  const hasFloors = building.floors.length > 0;
  const projectHref = `/projects/${projectSlug}`;
  const districtHref = `/projects/${projectSlug}/districts/${districtSlug}`;
  const buildingHref = `${districtHref}/buildings/${buildingSlug}`;

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <PageHero
        eyebrow={
          <>
            <Link
              href={projectHref}
              className="underline-offset-4 hover:underline"
            >
              {building.district.project.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={districtHref}
              className="underline-offset-4 hover:underline"
            >
              {building.district.name}
            </Link>
          </>
        }
        title={building.name}
        description={building.description}
        backHref={districtHref}
        backLabel="Թաղամաս"
        activeStep={3}
        stepHrefs={{
          1: projectHref,
          2: districtHref,
          3: buildingHref,
        }}
        guidance="Փուլ 3 · Hover հարկի գոտու վրա → նարնջագույն · Click → հատակագիծ / բնակարաններ։"
      />

      {payload3d && hasFloors ? (
        <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
          <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
            3D շենք
          </h2>
          <p className="mb-4 text-sm text-[var(--mp-ink-muted)]">
            {payload3d.building.model3dUrl
              ? "GLB model · հարկերն ընտրելի են hover/click-ով։"
              : "Procedural 3D preview · GLB դեռ չկա, հարկերն ընտրելի են։"}{" "}
            WebGL չլինելու դեպքում օգտագործեք աջ կողմի ցանկը։
          </p>
          <Building3DViewerLazy payload={payload3d} />
        </section>
      ) : null}

      <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
          Շենքի նկար
        </h2>
        <p className="mb-4 text-sm text-[var(--mp-ink-muted)]">
          Hover հարկի վրա → նարնջագույն գոտի։ Click → բացվում է այդ հարկի
          հատակագիծը (upload-ած նկարը)։
        </p>
        {renderPayload && renderPayload.floors.length > 0 ? (
          <BuildingRenderViewer
            imageUrl={renderPayload.building.imageUrl}
            imageWidth={renderPayload.building.imageWidth}
            imageHeight={renderPayload.building.imageHeight}
            viewBox={renderPayload.building.viewBox}
            buildingName={renderPayload.building.name}
            floors={renderPayload.floors}
          />
        ) : (
          <p className="text-sm text-[var(--mp-ink-muted)]">
            Հարկեր չկան կամ render mapping դեռ չկա։
          </p>
        )}
      </section>

      <section className="mx-auto max-w-[1600px] px-4 pb-12 md:px-8">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
          Հարկերի ցանկ
        </h2>
        <p className="mb-4 text-sm text-[var(--mp-ink-muted)]">
          Accessibility fallback — աշխատում է առանց WebGL և առանց 3D model-ի։
        </p>
        {building.floors.length === 0 ? (
          <p className="text-sm text-[var(--mp-ink-muted)]">
            Հարկեր դեռ չեն ավելացվել։
          </p>
        ) : (
          <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
            {building.floors.map((floor) => (
              <li key={floor.id}>
                <Link
                  href={`${buildingHref}/floors/${floor.floorNumber}`}
                  className="flex items-center justify-between px-4 py-3 text-sm transition hover:bg-[var(--mp-panel-hover)]"
                >
                  <span>{floor.name}</span>
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
                    Դիտել
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
