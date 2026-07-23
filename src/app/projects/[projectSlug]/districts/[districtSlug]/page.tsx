import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractiveDistrictPlan } from "@/components/district/InteractiveDistrictPlan";
import { getDistrictPlan } from "@/lib/district/get-district-plan";

type DistrictPageProps = {
  params: Promise<{
    projectSlug: string;
    districtSlug: string;
  }>;
};

export async function generateMetadata({
  params,
}: DistrictPageProps): Promise<Metadata> {
  const { projectSlug, districtSlug } = await params;
  const payload = await getDistrictPlan(projectSlug, districtSlug);
  if (!payload) return { title: "District not found" };
  return {
    title: `${payload.district.name} · ${payload.project.name}`,
    description: payload.district.description,
  };
}

export default async function DistrictPage({ params }: DistrictPageProps) {
  const { projectSlug, districtSlug } = await params;
  const payload = await getDistrictPlan(projectSlug, districtSlug);
  if (!payload) notFound();

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <header className="border-b border-[var(--mp-line)] px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mp-ink-muted)]">
              <Link
                href={`/projects/${projectSlug}`}
                className="underline-offset-4 hover:underline"
              >
                {payload.project.name}
              </Link>
              <span aria-hidden> / </span>
              Թաղամաս
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl md:text-5xl">
              {payload.district.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)] md:text-base">
              {payload.district.description}
            </p>
          </div>
          <Link
            href={`/projects/${projectSlug}`}
            className="text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
          >
            ← Masterplan
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-0 py-6 md:px-8">
        <InteractiveDistrictPlan payload={payload} />
      </section>
    </main>
  );
}
