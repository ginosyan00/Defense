"use client";

import Link from "next/link";
import type { MasterplanHotspotContract } from "@/types/masterplan";
import { canNavigateSpatialStatus } from "@/lib/spatial-status";

type MasterplanDistrictListProps = {
  hotspots: MasterplanHotspotContract[];
  activeId?: string | null;
  onHover?: (id: string | null) => void;
};

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

export function MasterplanDistrictList({
  hotspots,
  activeId,
  onHover,
}: MasterplanDistrictListProps) {
  const items = hotspots.filter((h) => h.status !== "HIDDEN");

  if (items.length === 0) {
    return (
      <p className="text-sm text-[var(--mp-ink-muted)]">
        Թաղամասեր դեռ ավելացված չեն։
      </p>
    );
  }

  return (
    <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
      {items.map((hotspot) => {
        const isActive = hotspot.id === activeId;
        const canNavigate = canNavigateSpatialStatus(hotspot.status);
        const content = (
          <span className="flex w-full items-center justify-between gap-4 px-4 py-3">
            <span className="flex items-center gap-3">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border text-sm ${
                  isActive
                    ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
                    : "border-[var(--mp-line)]"
                }`}
              >
                {hotspot.label}
              </span>
              <span>
                <span className="block text-sm text-[var(--mp-ink)]">
                  {hotspot.title}
                </span>
                <span className="block text-xs text-[var(--mp-ink-muted)]">
                  {statusText(hotspot.status)} · {hotspot.availableApartmentCount}{" "}
                  բնակարան
                </span>
              </span>
            </span>
            <span className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
              {canNavigate ? "Դիտել" : statusText(hotspot.status)}
            </span>
          </span>
        );

        if (!canNavigate) {
          return (
            <li
              key={hotspot.id}
              className={hotspot.status === "DISABLED" ? "opacity-50" : ""}
            >
              <div
                aria-disabled
                className={isActive ? "bg-[var(--mp-panel-hover)]" : ""}
                onMouseEnter={() => onHover?.(hotspot.id)}
                onMouseLeave={() => onHover?.(null)}
              >
                {content}
              </div>
            </li>
          );
        }

        return (
          <li key={hotspot.id}>
            <Link
              href={hotspot.href}
              className={`block transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mp-focus)] ${
                isActive ? "bg-[var(--mp-panel-hover)]" : ""
              }`}
              onMouseEnter={() => onHover?.(hotspot.id)}
              onMouseLeave={() => onHover?.(null)}
              onFocus={() => onHover?.(hotspot.id)}
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
