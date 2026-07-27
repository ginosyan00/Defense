import Link from "next/link";
import { notFound } from "next/navigation";
import { AdminPhaseCard } from "@/components/admin/AdminPhaseCard";
import { CreateEntityForm } from "@/components/admin/CreateProjectForm";
import { prisma } from "@/lib/db";

type PageProps = {
  params: Promise<{ projectSlug: string }>;
};

export default async function AdminProjectPage({ params }: PageProps) {
  const { projectSlug } = await params;
  const project = await prisma.project.findUnique({
    where: { slug: projectSlug },
    include: {
      districts: {
        orderBy: { sortOrder: "asc" },
        include: {
          buildings: {
            orderBy: { sortOrder: "asc" },
            include: {
              floors: {
                orderBy: { sortOrder: "asc" },
                include: {
                  apartments: {
                    where: { status: { not: "HIDDEN" } },
                    select: { id: true, svgPath: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!project) notFound();

  const districtsTotal = project.districts.length;
  const districtsDone = project.districts.filter(
    (d) => d.markerX != null && d.markerY != null,
  ).length;
  const phase1Done = districtsTotal > 0 && districtsDone >= districtsTotal;

  const allBuildings = project.districts.flatMap((d) =>
    d.buildings.map((b) => ({
      ...b,
      districtSlug: d.slug,
      districtName: d.name,
    })),
  );
  const buildingsDone = allBuildings.filter(
    (b) => b.markerX != null && b.markerY != null,
  ).length;
  const phase2Done =
    allBuildings.length > 0 && buildingsDone >= allBuildings.length;

  const unfinishedDistrict =
    project.districts.find((d) =>
      d.buildings.some((b) => b.markerX == null || b.markerY == null),
    ) ?? project.districts[0];

  const unfinishedBuilding =
    allBuildings.find(
      (b) =>
        b.floors.some((f) => f.markerX == null && !f.svgPath) ||
        b.floors.length === 0,
    ) ??
    allBuildings.find((b) =>
      b.floors.some((f) => f.markerX == null && !f.svgPath),
    ) ??
    allBuildings[0];

  const floorsTotal = allBuildings.reduce((sum, b) => sum + b.floors.length, 0);
  const floorsDone = allBuildings.reduce(
    (sum, b) =>
      sum +
      b.floors.filter((f) => f.markerX != null || Boolean(f.svgPath)).length,
    0,
  );
  const phase3Done = floorsTotal > 0 && floorsDone >= floorsTotal;

  const unfinishedFloorBuilding =
    allBuildings.find((b) =>
      b.floors.some((f) => f.apartments.some((a) => !a.svgPath)),
    ) ?? allBuildings[0];

  const unfinishedFloor =
    unfinishedFloorBuilding?.floors.find((f) =>
      f.apartments.some((a) => !a.svgPath),
    ) ?? unfinishedFloorBuilding?.floors[0];

  const apartmentsTotal = allBuildings.reduce(
    (sum, b) => sum + b.floors.reduce((s, f) => s + f.apartments.length, 0),
    0,
  );
  const apartmentsDone = allBuildings.reduce(
    (sum, b) =>
      sum +
      b.floors.reduce(
        (s, f) => s + f.apartments.filter((a) => Boolean(a.svgPath)).length,
        0,
      ),
    0,
  );
  const phase4Done =
    apartmentsTotal > 0 && apartmentsDone >= apartmentsTotal;

  const activeStep = !phase1Done
    ? 1
    : !phase2Done
      ? 2
      : !phase3Done
        ? 3
        : !phase4Done
          ? 4
          : 0;

  const phase1Href = `/admin/projects/${project.slug}/masterplan`;
  const phase2Href = unfinishedDistrict
    ? `/admin/projects/${project.slug}/districts/${unfinishedDistrict.slug}`
    : phase1Href;
  const phase3Href = unfinishedBuilding
    ? `/admin/projects/${project.slug}/districts/${unfinishedBuilding.districtSlug}/buildings/${unfinishedBuilding.slug}/render`
    : phase2Href;
  const phase3MeshHref = unfinishedBuilding
    ? `/admin/projects/${project.slug}/districts/${unfinishedBuilding.districtSlug}/buildings/${unfinishedBuilding.slug}/3d`
    : undefined;
  const phase4Href =
    unfinishedFloorBuilding && unfinishedFloor
      ? `/admin/projects/${project.slug}/districts/${unfinishedFloorBuilding.districtSlug}/buildings/${unfinishedFloorBuilding.slug}/floors/${unfinishedFloor.floorNumber}`
      : phase3Href;

  const phase2Extras = project.districts
    .filter((d) => d.id !== unfinishedDistrict?.id)
    .map((d) => ({
      href: `/admin/projects/${project.slug}/districts/${d.slug}`,
      label: `Add · ${d.name}`,
    }));

  const phase3Extras = allBuildings
    .filter((b) => b.id !== unfinishedBuilding?.id)
    .slice(0, 6)
    .map((b) => ({
      href: `/admin/projects/${project.slug}/districts/${b.districtSlug}/buildings/${b.slug}/render`,
      label: `Add · ${b.districtName} · ${b.name}`,
    }));

  if (phase3MeshHref && unfinishedBuilding) {
    phase3Extras.unshift({
      href: phase3MeshHref,
      label: `Add · 3D · ${unfinishedBuilding.name}`,
    });
  }

  const phase4Extras = allBuildings
    .flatMap((b) => b.floors.map((f) => ({ building: b, floor: f })))
    .filter(
      ({ building, floor }) =>
        !(
          building.id === unfinishedFloorBuilding?.id &&
          floor.id === unfinishedFloor?.id
        ),
    )
    .filter(({ floor }) => floor.apartments.some((a) => !a.svgPath))
    .slice(0, 6)
    .map(({ building, floor }) => ({
      href: `/admin/projects/${project.slug}/districts/${building.districtSlug}/buildings/${building.slug}/floors/${floor.floorNumber}`,
      label: `Add · ${building.name} · ${floor.name}`,
    }));

  return (
    <main className="mx-auto max-w-3xl space-y-8">
      <div>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← Նախագծեր
        </Link>
        <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-[family-name:var(--font-display)] text-4xl">
              {project.name}
            </h1>
            <p className="mt-2 text-sm text-[var(--mp-ink-muted)]">
              {activeStep === 0
                ? "Բոլոր փուլերը պատրաստ են"
                : `Հիմա միայն Փուլ ${activeStep}-ը արա այս նախագծի համար`}
            </p>
          </div>
          <Link
            href={`/projects/${project.slug}`}
            className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
          >
            Public site
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <AdminPhaseCard
          step={1}
          title="Թաղամասեր"
          hint="Նախ ստեղծիր թաղամաս, հետո masterplan-ի վրա դրիր marker/polygon։"
          state={activeStep === 1 ? "active" : phase1Done ? "done" : "locked"}
          progressLabel={`${districtsDone}/${districtsTotal || 0} mapped`}
          addHref={districtsTotal > 0 ? phase1Href : undefined}
          addLabel="Add · թաղամասեր map"
        >
          <CreateEntityForm
            title="Create թաղամաս"
            submitLabel="Create թաղամաս"
            action="district"
            hidden={{ projectSlug: project.slug }}
            fields={[
              {
                name: "name",
                label: "Անուն",
                placeholder: "օր. Թաղամաս Ա",
              },
              {
                name: "markerLabel",
                label: "Marker (ոչ պարտադիր)",
                placeholder: "Ա",
                required: false,
              },
            ]}
          />
        </AdminPhaseCard>

        <AdminPhaseCard
          step={2}
          title="Շենքեր"
          hint={
            unfinishedDistrict
              ? `Ստեղծիր շենք, հետո ${unfinishedDistrict.name}-ի վրա տեղադրիր։`
              : "Ստեղծիր շենքեր և տեղադրիր թաղամասի պլանի վրա։"
          }
          state={activeStep === 2 ? "active" : phase2Done ? "done" : "locked"}
          progressLabel={`${buildingsDone}/${allBuildings.length || 0} mapped`}
          addHref={allBuildings.length > 0 ? phase2Href : undefined}
          addLabel={
            unfinishedDistrict
              ? `Add · շենքեր map · ${unfinishedDistrict.name}`
              : "Add · շենքեր map"
          }
          extras={activeStep === 2 ? phase2Extras : []}
        >
          {unfinishedDistrict ? (
            <CreateEntityForm
              title={`Create շենք · ${unfinishedDistrict.name}`}
              submitLabel="Create շենք"
              action="building"
              hidden={{
                projectSlug: project.slug,
                districtSlug: unfinishedDistrict.slug,
              }}
              fields={[
                {
                  name: "name",
                  label: "Անուն",
                  placeholder: "օր. Building 01",
                },
                {
                  name: "buildingNumber",
                  label: "Համար (ոչ պարտադիր)",
                  placeholder: "01",
                  required: false,
                },
              ]}
            />
          ) : null}
        </AdminPhaseCard>

        <AdminPhaseCard
          step={3}
          title="Հարկեր"
          hint={
            unfinishedBuilding
              ? `${unfinishedBuilding.name}-ի render-ի վրա գծիր հարկերը (կամ ավելացրու նոր հարկ)։`
              : "Շենքի նկարի վրա գծիր հարկերը։"
          }
          state={activeStep === 3 ? "active" : phase3Done ? "done" : "locked"}
          progressLabel={`${floorsDone}/${floorsTotal || 0} mapped`}
          addHref={floorsTotal > 0 || unfinishedBuilding ? phase3Href : undefined}
          addLabel={
            unfinishedBuilding
              ? `Add · հարկեր map · ${unfinishedBuilding.name}`
              : "Add · հարկեր map"
          }
          extras={activeStep === 3 ? phase3Extras : []}
        >
          {unfinishedBuilding ? (
            <CreateEntityForm
              title={`Create հարկ · ${unfinishedBuilding.name}`}
              submitLabel="Create հարկ"
              action="floor"
              hidden={{
                projectSlug: project.slug,
                districtSlug: unfinishedBuilding.districtSlug,
                buildingSlug: unfinishedBuilding.slug,
              }}
              fields={[
                {
                  name: "name",
                  label: "Անուն (ոչ պարտադիր)",
                  placeholder: "Հարկ 6",
                  required: false,
                },
              ]}
            />
          ) : null}
        </AdminPhaseCard>

        <AdminPhaseCard
          step={4}
          title="Բնակարաններ"
          hint={
            unfinishedFloorBuilding && unfinishedFloor
              ? `Ստեղծիր բնակարան, հետո ${unfinishedFloorBuilding.name} · ${unfinishedFloor.name}-ի վրա գծիր։`
              : "Հատակագծի վրա գծիր բնակարանները։"
          }
          state={activeStep === 4 ? "active" : phase4Done ? "done" : "locked"}
          progressLabel={`${apartmentsDone}/${apartmentsTotal || 0} mapped`}
          addHref={
            apartmentsTotal > 0 || unfinishedFloor ? phase4Href : undefined
          }
          addLabel={
            unfinishedFloorBuilding && unfinishedFloor
              ? `Add · բնակարաններ map · ${unfinishedFloorBuilding.name} · ${unfinishedFloor.name}`
              : "Add · բնակարաններ map"
          }
          extras={activeStep === 4 ? phase4Extras : []}
        >
          {unfinishedFloorBuilding && unfinishedFloor ? (
            <CreateEntityForm
              title={`Create բնակարան · ${unfinishedFloor.name}`}
              submitLabel="Create բնակարան"
              action="apartment"
              hidden={{
                projectSlug: project.slug,
                districtSlug: unfinishedFloorBuilding.districtSlug,
                buildingSlug: unfinishedFloorBuilding.slug,
                floorNumber: unfinishedFloor.floorNumber,
              }}
              fields={[
                {
                  name: "apartmentNumber",
                  label: "Համար",
                  placeholder: "101",
                },
              ]}
            />
          ) : null}
        </AdminPhaseCard>
      </div>

      {activeStep === 0 ? (
        <p className="border border-[var(--mp-line)] bg-[var(--mp-panel)] px-4 py-3 text-sm">
          Պատրաստ է։ Ստուգիր{" "}
          <Link
            href={`/projects/${project.slug}`}
            className="underline-offset-4 hover:underline"
          >
            public masterplan
          </Link>
          -ում։
        </p>
      ) : null}
    </main>
  );
}
