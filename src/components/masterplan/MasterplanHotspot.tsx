"use client";

import type { SpatialHotspotBase } from "@/types/spatial";
import { normalizedToPercent } from "@/lib/coordinates";
import { formatMarkerLabel } from "@/lib/format-marker-label";
import { isMutedSpatialStatus } from "@/lib/spatial-status";

type MasterplanHotspotProps = {
  hotspot: SpatialHotspotBase;
  isHovered: boolean;
  isSelected: boolean;
  isFocused: boolean;
  /** When false, marker is decorative (still image preview). */
  interactive?: boolean;
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
  interactive = true,
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

  const muted = isMutedSpatialStatus(hotspot.status);
  const scale =
    interactive && (isHovered || isSelected || isFocused) ? 1.12 : 1;
  const markerClass = `absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold tracking-wide text-white shadow-[0_3px_10px_rgba(0,0,0,0.35)] ${
    interactive ? "transition-transform duration-150" : ""
  } ${muted ? "bg-[#c47a45] opacity-85" : "bg-[#e07a2f]"} ${
    interactive && (isSelected || isFocused)
      ? "ring-2 ring-white/80 ring-offset-1 ring-offset-transparent"
      : ""
  }`;
  const markerStyle = {
    left: `${xPercent}%`,
    top: `${yPercent}%`,
    transform: `translate(-50%, -50%) scale(${scale})`,
  };

  if (!interactive) {
    return (
      <span
        data-hotspot={hotspot.id}
        className={`${markerClass} pointer-events-none`}
        style={markerStyle}
        aria-hidden
      >
        <span>{formatMarkerLabel(hotspot.label)}</span>
      </span>
    );
  }

  return (
    <button
      type="button"
      data-hotspot={hotspot.id}
      aria-label={`${hotspot.title}, ${statusLabel(hotspot.status)}, ${hotspot.availableApartmentCount} հասանելի բնակարան`}
      aria-pressed={isSelected}
      disabled={hotspot.status === "DISABLED"}
      className={`${markerClass} focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--mp-focus)]`}
      style={markerStyle}
      onMouseEnter={() => onHover(hotspot.id)}
      onMouseLeave={() => onHover(null)}
      onFocus={() => onFocus(hotspot.id)}
      onBlur={() => onFocus(null)}
      onClick={() => onSelect(hotspot.id)}
    >
      <span aria-hidden>{formatMarkerLabel(hotspot.label)}</span>
    </button>
  );
}
