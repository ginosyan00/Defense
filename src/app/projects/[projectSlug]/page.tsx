import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractiveMasterplan } from "@/components/masterplan/InteractiveMasterplan";
import { MasterplanDistrictList } from "@/components/masterplan/MasterplanDistrictList";
import { getProjectMasterplan } from "@/lib/masterplan/get-project-masterplan";

type ProjectPageProps = {
  params: Promise<{ projectSlug: string }>;
};

export async function generateMetadata({
  params,
}: ProjectPageProps): Promise<Metadata> {
  const { projectSlug } = await params;
  const payload = await getProjectMasterplan(projectSlug);
  if (!payload) {
    return { title: "Project not found" };
  }
  return {
    title: `${payload.project.name} · Masterplan`,
    description: payload.project.description,
  };
}

export default async function ProjectMasterplanPage({
  params,
}: ProjectPageProps) {
  const { projectSlug } = await params;
  const payload = await getProjectMasterplan(projectSlug);
  if (!payload) notFound();

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <header className="border-b border-[var(--mp-line)] px-4 py-5 md:px-8">
        <div className="mx-auto flex max-w-[1600px] flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mp-ink-muted)]">
              {payload.project.location}
            </p>
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl md:text-5xl">
              {payload.project.name}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)] md:text-base">
              {payload.project.description}
            </p>
          </div>
          <Link
            href="/"
            className="text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
          >
            Գլխավոր
          </Link>
        </div>
      </header>

      <section className="mx-auto max-w-[1600px] px-0 md:px-8 md:pt-6">
        <InteractiveMasterplan payload={payload} />
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl">
          Թաղամասեր
        </h2>
        <p className="mb-4 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          Ցանկը հասանելի է ստեղնաշարով և screen reader-ով՝ որպես masterplan
          overlay-ի պարտադիր fallback։
        </p>
        <MasterplanDistrictList hotspots={payload.hotspots} />
      </section>
    </main>
  );
}
