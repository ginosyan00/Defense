"use client";

import type { SpatialHotspotBase } from "@/types/spatial";
import { normalizedToPercent } from "@/lib/coordinates";

type MasterplanHotspotProps = {
  hotspot: SpatialHotspotBase;
  isHovered: boolean;
  isSelected: boolean;
  isFocused: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onFocus: (id: string | null) => void;
};

function statusLabel(status: SpatialHotspotBase["status"]): string {
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

export function MasterplanHotspot({
  hotspot,
  isHovered,
  isSelected,
  isFocused,
  onHover,
  onSelect,
  onFocus,
}: MasterplanHotspotProps) {
  if (hotspot.status === "HIDDEN" || hotspot.interactionType === "POLYGON") {
    return null;
  }

  const { xPercent, yPercent } = normalizedToPercent({
    x: hotspot.markerX,
    y: hotspot.markerY,
  });

  const muted =
    hotspot.status === "COMING_SOON" ||
    hotspot.status === "SOLD_OUT" ||
    hotspot.status === "DISABLED";

  const scale = isHovered || isSelected || isFocused ? 1.12 : 1;

  return (
    <button
      type="button"
      data-hotspot={hotspot.id}
      aria-label={`${hotspot.title}, ${statusLabel(hotspot.status)}, ${hotspot.availableApartmentCount} հասանելի բնակարան`}
      aria-pressed={isSelected}
      disabled={hotspot.status === "DISABLED"}
      className={`absolute z-10 flex min-h-11 min-w-11 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border text-sm font-medium tracking-wide shadow-[0_6px_18px_rgba(0,0,0,0.28)] transition-transform duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mp-focus)] ${
        muted
          ? "border-[var(--mp-marker-muted-border)] bg-[var(--mp-marker-muted)] text-[var(--mp-marker-muted-ink)]"
          : "border-[var(--mp-marker-border)] bg-[var(--mp-marker)] text-[var(--mp-marker-ink)]"
      } ${isSelected || isFocused ? "ring-2 ring-[var(--mp-focus)] ring-offset-2 ring-offset-transparent" : ""}`}
      style={{
        left: `${xPercent}%`,
        top: `${yPercent}%`,
        transform: `translate(-50%, -50%) scale(${scale})`,
      }}
      onMouseEnter={() => onHover(hotspot.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocus(hotspot.id)}
      onBlur={() => onFocus(null)}
      onClick={() => onSelect(hotspot.id)}
    >
      <span aria-hidden>{hotspot.label}</span>
    </button>
  );
}
