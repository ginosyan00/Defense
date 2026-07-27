import Link from "next/link";
import { JOURNEY_STEPS } from "@/lib/site/journey";

const MASTERPLAN_HREF = "/projects/defense-residence";

export default function HomePage() {
  return (
    <main className="min-h-full">
      <section className="relative isolate min-h-[min(92dvh,880px)] overflow-hidden bg-[var(--mp-stage)] text-[var(--mp-panel)]">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_20%_15%,rgba(138,115,72,0.28),transparent_48%),radial-gradient(ellipse_at_85%_70%,rgba(244,242,236,0.08),transparent_42%),linear-gradient(165deg,#1c1f1c_0%,#141614_55%,#101210_100%)]"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.14] [background-image:linear-gradient(rgba(244,242,236,0.07)_1px,transparent_1px),linear-gradient(90deg,rgba(244,242,236,0.07)_1px,transparent_1px)] [background-size:72px_72px]"
        />

        <div className="relative mx-auto flex min-h-[min(92dvh,880px)] max-w-[1600px] flex-col justify-end px-4 pb-16 pt-24 md:px-8 md:pb-20">
          <div className="max-w-3xl animate-[mp-fade-up_520ms_ease-out]">
            <p className="font-[family-name:var(--font-display)] text-5xl leading-none tracking-wide md:text-7xl lg:text-8xl">
              Defense Residence
            </p>
            <h1 className="mt-6 max-w-xl text-lg font-medium leading-snug text-[var(--mp-panel)]/92 md:text-2xl">
              Թաղամասից մինչև բնակարան՝ չորս պարզ քայլով
            </h1>
            <p className="mt-3 max-w-lg text-sm leading-relaxed text-[var(--mp-panel)]/65 md:text-base">
              Ինտերակտիվ aerial masterplan-ով ընտրիր թաղամասը, շենքը, հարկը և
              բնակարանը։
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href={MASTERPLAN_HREF}
                className="inline-flex border border-[var(--mp-panel)] bg-[var(--mp-panel)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-ink)] transition hover:bg-transparent hover:text-[var(--mp-panel)]"
              >
                Սկսել ընտրությունը
              </Link>
              <Link
                href="#how-to"
                className="inline-flex border border-[var(--mp-panel)]/35 px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)]/80 transition hover:border-[var(--mp-panel)] hover:text-[var(--mp-panel)]"
              >
                Ինչպես է աշխատում
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section
        id="how-to"
        className="mx-auto max-w-[1600px] px-4 py-16 md:px-8 md:py-20"
      >
        <div className="max-w-2xl animate-[mp-fade-in_600ms_ease-out]">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mp-ink-muted)]">
            Ընտրության փուլեր
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-display)] text-3xl md:text-4xl">
            Ինչպես ընտրել
          </h2>
          <p className="mt-3 text-sm text-[var(--mp-ink-muted)] md:text-base">
            Յուրաքանչյուր էջում կտեսնես նույն չորս փուլերը՝ հասկանալու համար՝
            որտեղ ես և ինչ է հաջորդը։
          </p>
        </div>

        <ol className="mt-10 grid gap-6 md:grid-cols-2 lg:grid-cols-4 lg:gap-8">
          {JOURNEY_STEPS.map((step) => (
            <li key={step.id} className="border-t border-[var(--mp-line)] pt-4">
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

        <div className="mt-12 flex flex-wrap items-center gap-4">
          <Link
            href={MASTERPLAN_HREF}
            className="inline-flex border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)] transition hover:bg-transparent hover:text-[var(--mp-ink)]"
          >
            Բացել masterplan
          </Link>
          <Link
            href="/admin"
            className="text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)] underline-offset-4 transition hover:text-[var(--mp-ink)] hover:underline"
          >
            Admin mapping
          </Link>
        </div>
      </section>
    </main>
  );
}
