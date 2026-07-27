import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { InteractiveMasterplan } from "@/components/masterplan/InteractiveMasterplan";
import { MasterplanDistrictList } from "@/components/masterplan/MasterplanDistrictList";
import { PageHero } from "@/components/site/PageHero";
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
      <PageHero
        eyebrow={payload.project.location}
        title={payload.project.name}
        description={payload.project.description}
        backHref="/"
        backLabel="Գլխավոր"
        activeStep={1}
        stepHrefs={{ 1: "/" }}
        guidance="Փուլ 1 · Սեղմիր թաղամասի նշիչը կամ պոլիգոնը՝ շենքերի պլանին անցնելու համար։"
      />

      <section className="mx-auto max-w-[1600px] px-0 md:px-8 md:pt-6">
        <InteractiveMasterplan payload={payload} />
      </section>

      <section className="mx-auto max-w-[1600px] px-4 py-10 md:px-8">
        <h2 className="mb-2 font-[family-name:var(--font-display)] text-2xl">
          Թաղամասեր
        </h2>
        <p className="mb-5 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
          Ստեղնաշարով և screen reader-ով հասանելի ցանկ՝ masterplan overlay-ի
          պարտադիր fallback։ Սա նույն Փուլ 1-ն է։
        </p>
        <MasterplanDistrictList hotspots={payload.hotspots} />
      </section>
    </main>
  );
}
