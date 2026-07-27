import Link from "next/link";
import { CreateProjectForm } from "@/components/admin/CreateProjectForm";
import { prisma } from "@/lib/db";

type PageProps = {
  searchParams: Promise<{ error?: string }>;
};

function projectProgress(project: {
  districts: {
    markerX: number | null;
    markerY: number | null;
    buildings: {
      markerX: number | null;
      markerY: number | null;
      floors: {
        markerX: number | null;
        svgPath: string | null;
        apartments: { svgPath: string | null }[];
      }[];
    }[];
  }[];
}): { activeStep: number; label: string } {
  const districtsTotal = project.districts.length;
  const districtsDone = project.districts.filter(
    (d) => d.markerX != null && d.markerY != null,
  ).length;
  const phase1Done = districtsTotal > 0 && districtsDone >= districtsTotal;

  const allBuildings = project.districts.flatMap((d) => d.buildings);
  const buildingsDone = allBuildings.filter(
    (b) => b.markerX != null && b.markerY != null,
  ).length;
  const phase2Done =
    allBuildings.length > 0 && buildingsDone >= allBuildings.length;

  const floorsTotal = allBuildings.reduce((sum, b) => sum + b.floors.length, 0);
  const floorsDone = allBuildings.reduce(
    (sum, b) =>
      sum +
      b.floors.filter((f) => f.markerX != null || Boolean(f.svgPath)).length,
    0,
  );
  const phase3Done = floorsTotal > 0 && floorsDone >= floorsTotal;

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

  return {
    activeStep,
    label:
      activeStep === 0
        ? "Բոլոր փուլերը պատրաստ են"
        : `Փուլ ${activeStep} · շարունակիր`,
  };
}

export default async function AdminHomePage({ searchParams }: PageProps) {
  const { error } = await searchParams;
  const projects = await prisma.project.findMany({
    orderBy: { name: "asc" },
    include: {
      districts: {
        include: {
          buildings: {
            include: {
              floors: {
                include: {
                  apartments: {
                    where: { status: { not: "HIDDEN" } },
                    select: { svgPath: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  return (
    <main className="mx-auto max-w-3xl space-y-10">
      <div>
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Նախագծեր
        </h1>
        <p className="mt-2 text-sm text-[var(--mp-ink-muted)]">
          Ամեն շինարարություն՝ առանձին նախագիծ։ Create արա, հետո բացիր և անցիր 4
          փուլը։
        </p>
      </div>

      <CreateProjectForm defaultError={error ?? null} />

      <section className="space-y-3">
        <h2 className="text-[11px] uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
          Գոյություն ունեցող
        </h2>

        {projects.length === 0 ? (
          <p className="border border-dashed border-[var(--mp-line)] px-4 py-6 text-sm text-[var(--mp-ink-muted)]">
            Դեռ նախագիծ չկա։ Վերևում գրիր անունը և սեղմիր Create։
          </p>
        ) : null}

        <ul className="space-y-2">
          {projects.map((project) => {
            const { activeStep, label } = projectProgress(project);
            const buildingCount = project.districts.reduce(
              (sum, d) => sum + d.buildings.length,
              0,
            );

            return (
              <li key={project.id}>
                <Link
                  href={`/admin/projects/${project.slug}`}
                  className="flex flex-wrap items-center justify-between gap-3 border border-[var(--mp-line)] bg-[var(--mp-panel)] px-4 py-4 transition hover:border-[var(--mp-ink)]"
                >
                  <div>
                    <p className="font-[family-name:var(--font-display)] text-xl">
                      {project.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
                      {project.districts.length} թաղամաս · {buildingCount} շենք
                      · {label}
                    </p>
                  </div>
                  <span className="text-xs uppercase tracking-[0.14em]">
                    {activeStep === 0 ? "Բացել" : `Փուլ ${activeStep} →`}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </main>
  );
}
