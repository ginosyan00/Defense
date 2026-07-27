"use client";

import type { MasterplanHotspotContract } from "@/types/masterplan";
import { formatMoney } from "@/lib/format-money";
import { canNavigateSpatialStatus } from "@/lib/spatial-status";

type MasterplanTooltipProps = {
  hotspot: MasterplanHotspotContract | null;
  anchor: { xPercent: number; yPercent: number } | null;
  visible: boolean;
  onView: (href: string) => void;
  onTooltipEnter: () => void;
  onTooltipLeave: () => void;
};

function formatPrice(value: number | null, currency: string): string {
  if (value == null) return "—";
  return formatMoney(value, currency);
}

function statusText(status: MasterplanHotspotContract["status"]): string {
  switch (status) {
    case "AVAILABLE":
      return "Հասանելի";
    case "COMING_SOON":
      return "Շուտով";
    case "SOLD_OUT":
      return "Սպառված";
    case "DISABLED":
      return "Անհասանելի";
    default:
      return status;
  }
}

export function MasterplanTooltip({
  hotspot,
  anchor,
  visible,
  onView,
  onTooltipEnter,
  onTooltipLeave,
}: MasterplanTooltipProps) {
  if (!hotspot || !anchor || !visible) return null;

  const canNavigate = canNavigateSpatialStatus(hotspot.status);

  return (
    <div
      className="absolute z-20 hidden md:block"
      style={{
        left: `${anchor.xPercent}%`,
        top: `${anchor.yPercent}%`,
        transform: "translate(-50%, calc(-100% - 40px))",
      }}
      role="dialog"
      aria-label={hotspot.title}
      onMouseEnter={onTooltipEnter}
      onMouseLeave={onTooltipLeave}
    >
      <div className="w-[260px] border border-[var(--mp-line)] bg-[var(--mp-panel)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-[family-name:var(--font-display)] text-lg text-[var(--mp-ink)]">
            {hotspot.title}
          </p>
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
            {statusText(hotspot.status)}
          </span>
        </div>
        <dl className="space-y-1.5 text-xs text-[var(--mp-ink-muted)]">
          <div className="flex justify-between gap-3">
            <dt>Շենքեր</dt>
            <dd className="text-[var(--mp-ink)]">{hotspot.buildingCount}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Հասանելի բնակարաններ</dt>
            <dd className="text-[var(--mp-ink)]">
              {hotspot.availableApartmentCount}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Սկսած</dt>
            <dd className="text-[var(--mp-ink)]">
              {formatPrice(hotspot.minPrice, hotspot.currency)}
            </dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Ավարտ</dt>
            <dd className="text-[var(--mp-ink)]">
              {hotspot.completionDate
                ? new Date(hotspot.completionDate).toLocaleDateString("en-GB", {
                    year: "numeric",
                    month: "short",
                  })
                : "—"}
            </dd>
          </div>
        </dl>
        <button
          type="button"
          className="mt-4 w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)] transition hover:bg-transparent hover:text-[var(--mp-ink)] disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[var(--mp-ink)] disabled:hover:text-[var(--mp-panel)]"
          disabled={!canNavigate}
          onClick={() => {
            if (canNavigate) onView(hotspot.href);
          }}
        >
          {canNavigate ? "Դիտել" : "Շուտով"}
        </button>
      </div>
    </div>
  );
}
