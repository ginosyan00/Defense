import Link from "next/link";

export default function HomePage() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-20">
      <p className="text-xs uppercase tracking-[0.2em] text-[var(--mp-ink-muted)]">
        Interactive real-estate
      </p>
      <h1 className="font-[family-name:var(--font-display)] text-5xl leading-tight">
        Aerial masterplan MVP
      </h1>
      <p className="max-w-xl text-[var(--mp-ink-muted)]">
        Phase 0–2 foundation: raster aerial render, synchronized SVG overlay,
        normalized coordinates, and shareable project URL.
      </p>
      <Link
        href="/projects/defense-residence"
        className="inline-flex w-fit border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-5 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)] transition hover:bg-transparent hover:text-[var(--mp-ink)]"
      >
        Բացել masterplan
      </Link>
      <Link
        href="/admin"
        className="inline-flex w-fit border border-[var(--mp-line)] px-5 py-3 text-xs uppercase tracking-[0.18em] transition hover:bg-[var(--mp-panel-hover)]"
      >
        Admin mapping
      </Link>
    </main>
  );
}
