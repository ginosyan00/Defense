type MasterplanLegendProps = {
  availableCount: number;
  comingSoonCount: number;
  soldOutCount: number;
};

export function MasterplanLegend({
  availableCount,
  comingSoonCount,
  soldOutCount,
}: MasterplanLegendProps) {
  return (
    <div className="absolute left-[max(1rem,env(safe-area-inset-left))] top-[max(1rem,env(safe-area-inset-top))] z-30 border border-[var(--mp-line)] bg-[color-mix(in_srgb,var(--mp-panel)_92%,transparent)] px-3 py-2 text-[11px] tracking-wide text-[var(--mp-ink)] backdrop-blur-sm">
      <p className="mb-1.5 font-medium uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
        Կարգավիճակ
      </p>
      <ul className="space-y-1">
        <li className="flex items-center gap-2">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--mp-marker)]" aria-hidden />
          Հասանելի ({availableCount})
        </li>
        <li className="flex items-center gap-2">
          <span
            className="h-2.5 w-2.5 rounded-full bg-[var(--mp-marker-muted)]"
            aria-hidden
          />
          Շուտով ({comingSoonCount})
        </li>
        <li className="flex items-center gap-2">
          <span
            className="inline-flex h-2.5 w-2.5 items-center justify-center rounded-full border border-[var(--mp-marker-muted-border)] text-[8px]"
            aria-hidden
          >
            ×
          </span>
          Սպառված ({soldOutCount})
        </li>
      </ul>
    </div>
  );
}
