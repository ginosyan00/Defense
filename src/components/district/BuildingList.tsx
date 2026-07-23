"use client";

import Link from "next/link";
import type { BuildingHotspotContract } from "@/types/district-plan";

type BuildingListProps = {
  buildings: BuildingHotspotContract[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
};

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

export function BuildingList({
  buildings,
  activeId,
  onHover,
}: BuildingListProps) {
  const items = buildings.filter((b) => b.status !== "HIDDEN");

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--mp-ink-muted)]">
        Շենքեր դեռ ավելացված չեն։
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
      {items.map((building) => {
        const isActive = building.id === activeId;
        const content = (
          <span className="flex w-full items-center justify-between gap-4 px-4 py-3">
            <span className="flex items-center gap-3">
              <span
                className={`flex h-8 min-w-8 items-center justify-center rounded-full border px-2 text-sm ${
                  isActive
                    ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                    : "border-[var(--mp-line)]"
                }`}
              >
                {building.label}
              </span>
              <span>
                <span className="block text-sm text-[var(--mp-ink)]">
                  Շենք {building.buildingNumber.padStart(2, "0")}
                </span>
                <span className="block text-xs text-[var(--mp-ink-muted)]">
                  {statusText(building.status)} · {building.floorsCount} հարկ ·{" "}
                  {building.availableApartmentCount} բնակարան
                </span>
              </span>
            </span>
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
              Դիտել
            </span>
          </span>
        );

        if (building.status === "DISABLED") {
          return (
            <li key={building.id} className="opacity-50">
              <div aria-disabled>{content}</div>
            </li>
          );
        }

        return (
          <li key={building.id}>
            <Link
              href={building.href}
              className={`block transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mp-focus)] ${
                isActive ? "bg-[var(--mp-panel-hover)]" : ""
              }`}
              onMouseEnter={() => onHover?.(building.id)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(building.id)}
              onBlur={() => onHover?.(null)}
            >
              {content}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
