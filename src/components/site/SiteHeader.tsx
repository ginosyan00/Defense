import Link from "next/link";

type SiteHeaderProps = {
  masterplanHref?: string;
};

export function SiteHeader({
  masterplanHref = "/projects/defense-residence",
}: SiteHeaderProps) {
  return (
    <header className="border-b border-[var(--mp-line)] bg-[var(--mp-canvas)]/90 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4 px-4 py-3.5 md:px-8">
        <Link
          href={masterplanHref}
          className="font-[family-name:var(--font-display)] text-xl tracking-wide text-[var(--mp-ink)] transition hover:opacity-80"
        >
          Defense Residence
        </Link>
        <nav
          className="flex items-center gap-5 text-[11px] uppercase tracking-[0.18em] text-[var(--mp-ink-muted)]"
          aria-label="Primary"
        >
          <Link
            href="/"
            className="underline-offset-4 transition hover:text-[var(--mp-ink)] hover:underline"
          >
            Գլխավոր
          </Link>
          <Link
            href={masterplanHref}
            className="underline-offset-4 transition hover:text-[var(--mp-ink)] hover:underline"
          >
            Masterplan
          </Link>
          <Link
            href="/admin"
            className="border border-[var(--mp-line)] px-3 py-1.5 text-[var(--mp-ink)] transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mp-focus)]"
          >
            Admin
          </Link>
        </nav>
      </div>
    </header>
  );
}
