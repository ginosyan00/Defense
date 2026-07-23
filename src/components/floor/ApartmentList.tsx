"use client";

import Link from "next/link";
import type { FloorApartmentContract } from "@/types/floor-plan";
import {
  apartmentStatusLabel,
  formatMoney,
} from "@/lib/floor/apartment-status";

type ApartmentListProps = {
  apartments: FloorApartmentContract[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
};

export function ApartmentList({
  apartments,
  activeId,
  onHover,
}: ApartmentListProps) {
  if (apartments.length === 0) {
    return (
      <p className="text-sm text-[var(--mp-ink-muted)]">
        Այս հարկում հրապարակված բնակարաններ չկան։
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
      {apartments.map((apartment) => {
        const isActive = apartment.id === activeId;
        const sold = apartment.status === "SOLD";

        return (
          <li key={apartment.id}>
            <Link
              href={apartment.href}
              className={`block transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mp-focus)] ${
                isActive ? "bg-[var(--mp-panel-hover)]" : ""
              } ${sold ? "opacity-70" : ""}`}
              onMouseEnter={() => onHover?.(apartment.id)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(apartment.id)}
              onBlur={() => onHover?.(null)}
            >
              <span className="flex items-center justify-between gap-4 px-4 py-3">
                <span>
                  <span className="block text-sm text-[var(--mp-ink)]">
                    Բնակարան {apartment.apartmentNumber}
                  </span>
                  <span className="block text-xs text-[var(--mp-ink-muted)]">
                    {apartmentStatusLabel(apartment.status)} · {apartment.rooms}{" "}
                    սենյակ · {apartment.totalArea} մ² ·{" "}
                    {formatMoney(apartment.price, apartment.currency)}
                  </span>
                </span>
                <span className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
                  {sold ? "Տեղեկատվություն" : "Դիտել"}
                </span>
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
