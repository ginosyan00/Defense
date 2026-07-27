import Link from "next/link";
import { InteractiveMasterplan } from "@/components/masterplan/InteractiveMasterplan";
import { MasterplanDistrictList } from "@/components/masterplan/MasterplanDistrictList";
import { PageHero } from "@/components/site/PageHero";
import { getProjectMasterplan } from "@/lib/masterplan/get-project-masterplan";
import {
  getPrimaryPublicProject,
  masterplanPath,
} from "@/lib/site/get-primary-public-project";
import { JOURNEY_STEPS } from "@/lib/site/journey";

export default async function HomePage() {
  const primary = await getPrimaryPublicProject();

  if (!primary) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-20 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          Masterplan
        </h1>
        <p className="mt-3 text-[var(--mp-ink-muted)]">
          Դեռևս նախագիծ չկա։ Ստեղծիր մեկը Admin-ից։
        </p>
        <Link
          href="/admin"
          className="mt-6 inline-flex border border-[var(--mp-ink)] px-4 py-2 text-xs uppercase tracking-[0.18em]"
        >
          Admin
        </Link>
      </main>
    );
  }

  const payload = await getProjectMasterplan(primary.slug);
  if (!payload) {
    return (
      <main className="mx-auto max-w-[1600px] px-4 py-20 md:px-8">
        <h1 className="font-[family-name:var(--font-display)] text-4xl">
          {primary.name}
        </h1>
        <p className="mt-3 text-[var(--mp-ink-muted)]">
          Masterplan տվյալները հասանելի չեն։
        </p>
      </main>
    );
  }

  const projectHref = masterplanPath(primary.slug);

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <PageHero
        eyebrow={payload.project.location}
        title={payload.project.name}
        description={payload.project.description}
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
          պարտադիր fallback։
        </p>
        <MasterplanDistrictList hotspots={payload.hotspots} />

        <ol className="mt-14 grid gap-6 border-t border-[var(--mp-line)] pt-10 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {JOURNEY_STEPS.map((step) => (
            <li key={step.id}>
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--mp-ink-muted)]">
                Փուլ {step.id}
              </p>
              <p className="mt-2 font-[family-name:var(--font-display)] text-2xl">
                {step.label}
              </p>
              <p className="mt-2 text-sm text-[var(--mp-ink-muted)]">
                {step.hint}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-8 text-xs text-[var(--mp-ink-muted)]">
          Նույն masterplan-ը՝{" "}
          <Link href={projectHref} className="underline underline-offset-4">
            {projectHref}
          </Link>
        </p>
      </section>
    </main>
  );
}
