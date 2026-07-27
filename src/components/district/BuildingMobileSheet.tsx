"use client";

import type { BuildingHotspotContract } from "@/types/district-plan";
import { formatMoney } from "@/lib/format-money";
import { canNavigateSpatialStatus } from "@/lib/spatial-status";

type BuildingMobileSheetProps = {
  building: BuildingHotspotContract | null;
  open: boolean;
  onClose: () => void;
  onView: (href: string) => void;
};

function formatPrice(value: number | null, currency: string): string {
  if (value == null) return "—";
  return formatMoney(value, currency);
}

function statusText(status: BuildingHotspotContract["status"]): string {
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

export function BuildingMobileSheet({
  building,
  open,
  onClose,
  onView,
}: BuildingMobileSheetProps) {
  if (!open || !building) return null;

  const canNavigate = canNavigateSpatialStatus(building.status);

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 md:hidden">
      <button
        type="button"
        className="absolute inset-0 -top-[100vh] bg-black/35"
        aria-label="Փակել"
        onClick={onClose}
      />
      <div
        className="relative border-t border-[var(--mp-line)] bg-[var(--mp-panel)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.25)]"
        role="dialog"
        aria-modal="true"
        aria-label={building.title}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--mp-line)]" />
        <div className="mb-3 flex items-start justify-between gap-3">
          <div>
            <p className="font-[family-name:var(--font-display)] text-xl text-[var(--mp-ink)]">
              {building.title}
            </p>
            <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
              Շենք {building.buildingNumber} · {statusText(building.status)}
            </p>
          </div>
          <button
            type="button"
            className="text-sm text-[var(--mp-ink-muted)]"
            onClick={onClose}
          >
            Փակել
          </button>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm text-[var(--mp-ink-muted)]">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em]">Հարկեր</dt>
            <dd className="text-[var(--mp-ink)]">{building.floorsCount}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em]">Բնակարաններ</dt>
            <dd className="text-[var(--mp-ink)]">
              {building.availableApartmentCount}
            </dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em]">Սկսած</dt>
            <dd className="text-[var(--mp-ink)]">
              {formatPrice(building.minPrice, building.currency)}
            </dd>
          </div>
        </dl>
        <div className="mt-4 flex gap-2">
          <button
            type="button"
            className="flex-1 border border-[var(--mp-line)] px-3 py-2.5 text-xs uppercase tracking-[0.16em]"
            onClick={onClose}
          >
            Հետ
          </button>
          <button
            type="button"
            className="flex-1 border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2.5 text-xs uppercase tracking-[0.16em] text-[var(--mp-panel)] disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!canNavigate}
            onClick={() => onView(building.href)}
          >
            Դիտել
          </button>
        </div>
      </div>
    </div>
  );
}
