"use client";

import Link from "next/link";
import type { FloorApartmentContract } from "@/types/floor-plan";
import {
  apartmentStatusLabel,
  formatMoney,
} from "@/lib/floor/apartment-status";

type FloorPlanMobileSheetProps = {
  apartment: FloorApartmentContract | null;
  open: boolean;
  onClose: () => void;
};

export function FloorPlanMobileSheet({
  apartment,
  open,
  onClose,
}: FloorPlanMobileSheetProps) {
  if (!open || !apartment) return null;

  const canOpen = apartment.status !== "SOLD";

  return (
    <div className="absolute inset-x-0 bottom-0 z-40 md:hidden">
      <button
        type="button"
        className="absolute inset-0 -top-[100vh] bg-black/35"
        aria-label="Փակել"
        onClick={onClose}
      />
      <div
        className="relative border-t border-[var(--mp-line)] bg-[var(--mp-panel)] px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3"
        role="dialog"
        aria-modal="true"
        aria-label={`Բնակարան ${apartment.apartmentNumber}`}
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-[var(--mp-line)]" />
        <p className="font-[family-name:var(--font-display)] text-xl">
          Բնակարան {apartment.apartmentNumber}
        </p>
        <p className="mt-1 text-xs uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
          {apartmentStatusLabel(apartment.status)}
        </p>
        <dl className="mt-3 grid grid-cols-2 gap-3 text-sm text-[var(--mp-ink-muted)]">
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em]">Սենյակներ</dt>
            <dd className="text-[var(--mp-ink)]">{apartment.rooms}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase tracking-[0.12em]">Մակերես</dt>
            <dd className="text-[var(--mp-ink)]">{apartment.totalArea} մ²</dd>
          </div>
          <div className="col-span-2">
            <dt className="text-[11px] uppercase tracking-[0.12em]">Գին</dt>
            <dd className="text-[var(--mp-ink)]">
              {formatMoney(apartment.price, apartment.currency)}
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
          {canOpen ? (
            <Link
              href={apartment.href}
              className="flex flex-1 items-center justify-center border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2.5 text-xs uppercase tracking-[0.16em] text-[var(--mp-panel)]"
            >
              Դիտել
            </Link>
          ) : (
            <span className="flex flex-1 items-center justify-center border border-[var(--mp-line)] px-3 py-2.5 text-xs uppercase tracking-[0.16em] opacity-40">
              Վաճառված
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
