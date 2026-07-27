import Link from "next/link";
import {
  JOURNEY_STEPS,
  type JourneyHrefs,
  type JourneyStepId,
} from "@/lib/site/journey";

type JourneyStepsProps = {
  activeStep: JourneyStepId;
  hrefs?: JourneyHrefs;
};

export function JourneySteps({ activeStep, hrefs }: JourneyStepsProps) {
  return (
    <nav aria-label="Ընտրության փուլեր" className="w-full">
      <ol className="flex flex-wrap items-stretch gap-2 md:gap-0">
        {JOURNEY_STEPS.map((step, index) => {
          const state =
            step.id < activeStep
              ? "done"
              : step.id === activeStep
                ? "active"
                : "upcoming";
          const href =
            state === "done" && hrefs?.[step.id] ? hrefs[step.id] : undefined;

          const content = (
            <span className="flex items-center gap-2.5 px-1 py-1 md:px-0">
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[11px] font-medium transition duration-200 ${
                  state === "active"
                    ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                    : state === "done"
                      ? "border-[var(--mp-focus)] bg-[var(--mp-focus)]/15 text-[var(--mp-ink)]"
                      : "border-[var(--mp-line)] text-[var(--mp-ink-muted)]"
                }`}
              >
                {step.id}
              </span>
              <span className="min-w-0">
                <span
                  className={`block text-xs uppercase tracking-[0.14em] ${
                    state === "upcoming"
                      ? "text-[var(--mp-ink-muted)]"
                      : "text-[var(--mp-ink)]"
                  }`}
                >
                  {step.label}
                </span>
                <span className="mt-0.5 hidden text-[11px] text-[var(--mp-ink-muted)] sm:block">
                  {step.hint}
                </span>
              </span>
            </span>
          );

          return (
            <li
              key={step.id}
              className="flex min-w-[9.5rem] flex-1 items-center md:min-w-0"
              aria-current={state === "active" ? "step" : undefined}
            >
              {href ? (
                <Link
                  href={href}
                  className="block w-full rounded-sm transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mp-focus)]"
                >
                  {content}
                </Link>
              ) : (
                <div className="w-full">{content}</div>
              )}
              {index < JOURNEY_STEPS.length - 1 ? (
                <span
                  aria-hidden
                  className={`mx-2 hidden h-px flex-1 md:block ${
                    step.id < activeStep
                      ? "bg-[var(--mp-focus)]"
                      : "bg-[var(--mp-line)]"
                  }`}
                />
              ) : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
