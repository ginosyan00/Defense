import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractiveFloorPlan } from "@/components/floor/InteractiveFloorPlan";
import { PageHero } from "@/components/site/PageHero";
import { getFloorPlan } from "@/lib/floor/get-floor-plan";

type FloorPageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
    buildingSlug: string;
    floorNumber: string;
  }>;
};

export async function generateMetadata({
  params,
}: FloorPageProps): Promise<Metadata> {
  const { projectSlug, districtSlug, buildingSlug, floorNumber } = await params;
  const number = Number(floorNumber);
  if (!Number.isFinite(number)) return { title: "Floor not found" };
  const payload = await getFloorPlan(
    projectSlug,
    districtSlug,
    buildingSlug,
    number,
  );
  if (!payload) return { title: "Floor not found" };
  return {
    title: `${payload.floor.name} · ${payload.building.name}`,
    description: `${payload.building.name}, ${payload.floor.name} interactive floor plan`,
  };
}

export default async function FloorPage({ params }: FloorPageProps) {
  const { projectSlug, districtSlug, buildingSlug, floorNumber } = await params;
  const number = Number(floorNumber);
  if (!Number.isFinite(number)) notFound();

  const payload = await getFloorPlan(
    projectSlug,
    districtSlug,
    buildingSlug,
    number,
  );
  if (!payload) notFound();

  const projectHref = "/";
  const districtHref = `/projects/${projectSlug}/districts/${districtSlug}`;
  const buildingHref = `${districtHref}/buildings/${buildingSlug}`;
  const floorHref = `${buildingHref}/floors/${number}`;

  const floorDescription = payload.floor.imageUrl
    ? payload.apartments.some((apt) => apt.svgPath)
      ? "Հատակագիծ · գծված բնակարանների տարածքներ"
      : "Հատակագիծ · այս շենքի համար դեռ գծագիր չկա"
    : "Interactive հատակագիծ";

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <PageHero
        eyebrow={
          <>
            <Link
              href={projectHref}
              className="underline-offset-4 hover:underline"
            >
              {payload.project.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={districtHref}
              className="underline-offset-4 hover:underline"
            >
              {payload.district.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={buildingHref}
              className="underline-offset-4 hover:underline"
            >
              {payload.building.name}
            </Link>
          </>
        }
        title={`${payload.building.name} · ${payload.floor.name}`}
        description={floorDescription}
        backHref={buildingHref}
        backLabel="Շենք"
        activeStep={3}
        stepHrefs={{
          1: projectHref,
          2: districtHref,
          3: floorHref,
        }}
        guidance="Փուլ 3–4 · Hover/click արա բնակարանի վրա՝ մանրամասները տեսնելու և բացելու համար։"
      />

      <section className="mx-auto max-w-[1600px] px-0 py-6 md:px-8">
        <InteractiveFloorPlan payload={payload} />
      </section>
    </main>
  );
}
