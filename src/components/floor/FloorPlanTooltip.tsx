"use client";

import Link from "next/link";
import type { FloorApartmentContract } from "@/types/floor-plan";
import {
  apartmentStatusLabel,
  formatMoney,
} from "@/lib/floor/apartment-status";

type FloorPlanTooltipProps = {
  apartment: FloorApartmentContract | null;
  visible: boolean;
  onTooltipEnter: () => void;
  onTooltipLeave: () => void;
};

export function FloorPlanTooltip({
  apartment,
  visible,
  onTooltipEnter,
  onTooltipLeave,
}: FloorPlanTooltipProps) {
  if (!apartment || !visible) return null;

  const canOpen = apartment.status !== "SOLD";

  return (
    <div
      className="absolute left-1/2 top-4 z-30 hidden w-[280px] -translate-x-1/2 md:block"
      role="dialog"
      aria-label={`Բնակարան ${apartment.apartmentNumber}`}
      onMouseEnter={onTooltipEnter}
      onMouseLeave={onTooltipLeave}
    >
      <div className="border border-[var(--mp-line)] bg-[var(--mp-panel)] p-4 shadow-[0_18px_40px_rgba(0,0,0,0.28)]">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="font-[family-name:var(--font-display)] text-lg">
            Բնակարան {apartment.apartmentNumber}
          </p>
          <span className="text-[10px] uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
            {apartmentStatusLabel(apartment.status)}
          </span>
        </div>
        <dl className="space-y-1.5 text-xs text-[var(--mp-ink-muted)]">
          <div className="flex justify-between gap-3">
            <dt>Սենյակներ</dt>
            <dd className="text-[var(--mp-ink)]">{apartment.rooms}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Մակերես</dt>
            <dd className="text-[var(--mp-ink)]">{apartment.totalArea} մ²</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt>Գին</dt>
            <dd className="text-[var(--mp-ink)]">
              {formatMoney(apartment.price, apartment.currency)}
            </dd>
          </div>
        </dl>
        {canOpen ? (
          <Link
            href={apartment.href}
            className="mt-4 block w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-center text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)] transition hover:bg-transparent hover:text-[var(--mp-ink)]"
          >
            Դիտել
          </Link>
        ) : (
          <span className="mt-4 block w-full border border-[var(--mp-line)] px-3 py-2 text-center text-xs uppercase tracking-[0.18em] opacity-40">
            Վաճառված է
          </span>
        )}
      </div>
    </div>
  );
}
