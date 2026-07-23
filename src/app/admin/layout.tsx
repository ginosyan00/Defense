import Link from "next/link";

export default function AdminLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <header className="border-b border-[var(--mp-line)] px-4 py-4 md:px-8">
        <div className="mx-auto flex max-w-[1600px] items-center justify-between gap-4">
          <div>
            <Link
              href="/admin"
              className="font-[family-name:var(--font-display)] text-xl"
            >
              Admin · Mapping
            </Link>
            <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
              Visual spatial editors · auth hardening TBD · normalized coords only
            </p>
          </div>
          <Link
            href="/projects/defense-residence"
            className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
          >
            Public site
          </Link>
        </div>
      </header>
      <div className="mx-auto max-w-[1600px] px-4 py-8 md:px-8">{children}</div>
    </div>
  );
}
