import Link from "next/link";
import type { ReactNode } from "react";
import { JourneySteps } from "@/components/site/JourneySteps";
import type { JourneyHrefs, JourneyStepId } from "@/lib/site/journey";

type PageHeroProps = {
  eyebrow?: ReactNode;
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  activeStep?: JourneyStepId;
  stepHrefs?: JourneyHrefs;
  guidance?: string;
  children?: ReactNode;
};

export function PageHero({
  eyebrow,
  title,
  description,
  backHref,
  backLabel = "Հետ",
  activeStep,
  stepHrefs,
  guidance,
  children,
}: PageHeroProps) {
  return (
    <header className="border-b border-[var(--mp-line)] bg-[linear-gradient(180deg,rgba(244,242,236,0.55)_0%,transparent_100%)]">
      <div className="mx-auto max-w-[1600px] space-y-5 px-4 py-6 md:px-8 md:py-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="max-w-3xl animate-[mp-fade-up_420ms_ease-out]">
            {eyebrow ? (
              <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mp-ink-muted)]">
                {eyebrow}
              </p>
            ) : null}
            <h1 className="mt-1 font-[family-name:var(--font-display)] text-3xl leading-tight md:text-5xl">
              {title}
            </h1>
            {description ? (
              <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)] md:text-base">
                {description}
              </p>
            ) : null}
            {guidance ? (
              <p className="mt-3 max-w-2xl text-xs leading-relaxed text-[var(--mp-ink-muted)] md:text-sm">
                {guidance}
              </p>
            ) : null}
            {children}
          </div>
          {backHref ? (
            <Link
              href={backHref}
              className="shrink-0 text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)] underline-offset-4 transition hover:text-[var(--mp-ink)] hover:underline"
            >
              ← {backLabel}
            </Link>
          ) : null}
        </div>

        {activeStep ? (
          <div className="border-t border-[var(--mp-line)] pt-4">
            <JourneySteps activeStep={activeStep} hrefs={stepHrefs} />
          </div>
        ) : null}
      </div>
    </header>
  );
}
