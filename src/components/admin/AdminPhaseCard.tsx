import Link from "next/link";
import type { ReactNode } from "react";

export type AdminPhaseCardProps = {
  step: number;
  title: string;
  hint: string;
  state: "locked" | "active" | "done";
  progressLabel: string;
  addHref?: string;
  addLabel?: string;
  extras?: { href: string; label: string }[];
  children?: ReactNode;
};

export function AdminPhaseCard({
  step,
  title,
  hint,
  state,
  progressLabel,
  addHref,
  addLabel,
  extras = [],
  children,
}: AdminPhaseCardProps) {
  const locked = state === "locked";
  const done = state === "done";
  const active = state === "active";

  return (
    <article
      className={`border p-5 transition ${
        active
          ? "border-[var(--mp-ink)] bg-[var(--mp-panel)]"
          : done
            ? "border-[var(--mp-line)] bg-transparent"
            : "border-[var(--mp-line)] opacity-55"
      }`}
      aria-current={active ? "step" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-sm ${
                done
                  ? "border-[var(--mp-focus)] bg-[var(--mp-focus)]/20"
                  : active
                    ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                    : "border-[var(--mp-line)]"
              }`}
            >
              {done ? "✓" : step}
            </span>
            <div>
              <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
                {locked
                  ? `Կողպված · նախ Փուլ ${step - 1}`
                  : done
                    ? "Պատրաստ է"
                    : "Հիմա արա սա"}
              </p>
              <h2 className="font-[family-name:var(--font-display)] text-2xl">
                {title}
              </h2>
            </div>
          </div>
          <p className="mt-3 max-w-xl text-sm text-[var(--mp-ink-muted)]">
            {hint}
          </p>
          <p className="mt-2 text-xs text-[var(--mp-ink-muted)]">{progressLabel}</p>
          {active ? children : null}
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-[220px]">
          {active && addHref && addLabel ? (
            <Link
              href={addHref}
              className="inline-flex items-center justify-center border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-4 py-3 text-center text-xs uppercase tracking-[0.16em] text-[var(--mp-panel)] transition hover:bg-transparent hover:text-[var(--mp-ink)]"
            >
              {addLabel}
            </Link>
          ) : null}

          {done && addHref ? (
            <Link
              href={addHref}
              className="inline-flex items-center justify-center border border-[var(--mp-line)] px-4 py-3 text-center text-xs uppercase tracking-[0.16em] transition hover:bg-[var(--mp-panel-hover)]"
            >
              Դիտել / խմբագրել
            </Link>
          ) : null}

          {locked ? (
            <span className="inline-flex items-center justify-center border border-dashed border-[var(--mp-line)] px-4 py-3 text-center text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
              Add · դեռ ոչ
            </span>
          ) : null}

          {active && extras.length > 0 ? (
            <div className="space-y-1.5 pt-1">
              <p className="text-[10px] uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
                Այլ Add
              </p>
              {extras.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="block border border-[var(--mp-line)] px-3 py-2 text-center text-[11px] uppercase tracking-[0.12em] transition hover:bg-[var(--mp-panel-hover)]"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </article>
  );
}
