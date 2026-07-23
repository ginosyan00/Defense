import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractiveFloorPlan } from "@/components/floor/InteractiveFloorPlan";
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

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <header className="border-b border-[var(--mp-line)] px-4 py-5 md:px-8">
        <div className="mx-auto max-w-[1600px]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mp-ink-muted)]">
            <Link
              href={`/projects/${projectSlug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.project.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={`/projects/${projectSlug}/districts/${districtSlug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.district.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={`/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.building.name}
            </Link>
          </p>
          <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl md:text-5xl">
            {payload.building.name} · {payload.floor.name}
          </h1>
          <p className="mt-2 text-sm text-[var(--mp-ink-muted)]">
            {payload.floor.imageUrl
              ? payload.apartments.some((apt) => apt.svgPath)
                ? "Հատակագիծ · գծված բնակարանների տարածքներ"
                : "Հատակագիծ · այս շենքի համար դեռ գծագիր չկա"
              : "Interactive հատակագիծ"}
          </p>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-0 py-6 md:px-8">
        <InteractiveFloorPlan payload={payload} />
      </section>
    </main>
  );
}
