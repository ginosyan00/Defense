import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { InteractiveDistrictPlan } from "@/components/district/InteractiveDistrictPlan";
import { PageHero } from "@/components/site/PageHero";
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
      <PageHero
        eyebrow={
          <>
            <Link
              href={`/projects/${projectSlug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.project.name}
            </Link>
            <span aria-hidden> / </span>
            Թաղամաս
          </>
        }
        title={payload.district.name}
        description={payload.district.description}
        backHref={`/projects/${projectSlug}`}
        backLabel="Masterplan"
        activeStep={2}
        stepHrefs={{
          1: `/projects/${projectSlug}`,
          2: `/projects/${projectSlug}/districts/${districtSlug}`,
        }}
        guidance="Փուլ 2 · Աչքի պատկերակով բացիր ինտերակտիվ ռեժիմը և ընտրիր շենքը map-ից կամ ցանկից։"
      />

      <section className="mx-auto max-w-[1600px] px-0 py-6 md:px-8">
        <InteractiveDistrictPlan payload={payload} />
      </section>
    </main>
  );
}
