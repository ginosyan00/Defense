"use client";

import type { SpatialHotspotBase } from "@/types/spatial";
import { isMutedSpatialStatus } from "@/lib/spatial-status";

type MasterplanSvgOverlayProps = {
  viewBox: string;
  hotspots: SpatialHotspotBase[];
  hoveredId: string | null;
  selectedId: string | null;
  focusedId: string | null;
  /** When false, polygons are decorative only. */
  interactive?: boolean;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
};

export function MasterplanSvgOverlay({
  viewBox,
  hotspots,
  hoveredId,
  selectedId,
  focusedId,
  interactive = true,
  onHover,
  onSelect,
}: MasterplanSvgOverlayProps) {
  const activeId = interactive
    ? (hoveredId ?? selectedId ?? focusedId)
    : null;

  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox={viewBox}
      preserveAspectRatio="none"
      role={interactive ? "group" : "presentation"}
      aria-label={interactive ? "Masterplan districts" : undefined}
      aria-hidden={interactive ? undefined : true}
    >
      <defs>
        <filter id="mp-glow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      {activeId ? (
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(12, 14, 12, 0.28)"
          aria-hidden
        />
      ) : null}

      {hotspots.map((hotspot) => {
        if (
          hotspot.interactionType === "MARKER" ||
          !hotspot.svgPath ||
          hotspot.status === "HIDDEN"
        ) {
          return null;
        }

        const isActive =
          interactive &&
          (hotspot.id === hoveredId ||
            hotspot.id === selectedId ||
            hotspot.id === focusedId);
        const muted = isMutedSpatialStatus(hotspot.status);
        const disabled = hotspot.status === "DISABLED";
        const keyboardTarget =
          interactive &&
          hotspot.interactionType === "POLYGON" &&
          !disabled;

        return (
          <path
            key={`poly-${hotspot.id}`}
            d={hotspot.svgPath}
            data-hotspot={hotspot.id}
            className={
              !interactive || disabled
                ? "pointer-events-none"
                : "pointer-events-auto cursor-pointer outline-none focus-visible:stroke-[3] focus-visible:stroke-[var(--mp-focus)]"
            }
            fill={
              isActive
                ? muted
                  ? "rgba(196, 168, 120, 0.32)"
                  : "rgba(214, 190, 140, 0.42)"
                : muted
                  ? "rgba(196, 168, 120, 0.12)"
                  : "rgba(214, 190, 140, 0.16)"
            }
            stroke={
              isActive
                ? "rgba(245, 232, 205, 0.95)"
                : "rgba(138, 115, 72, 0.55)"
            }
            strokeWidth={isActive ? 3 : 1.5}
            filter={isActive ? "url(#mp-glow)" : undefined}
            tabIndex={keyboardTarget ? 0 : undefined}
            role={keyboardTarget ? "button" : undefined}
            aria-label={keyboardTarget ? hotspot.title : undefined}
            aria-hidden={keyboardTarget ? undefined : true}
            onMouseEnter={() => {
              if (interactive && !disabled) onHover(hotspot.id);
            }}
            onMouseLeave={() => {
              if (interactive) onHover(null);
            }}
            onFocus={() => {
              if (keyboardTarget) onHover(hotspot.id);
            }}
            onBlur={() => {
              if (keyboardTarget) onHover(null);
            }}
            onKeyDown={(event) => {
              if (!keyboardTarget) return;
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                onSelect(hotspot.id);
              }
            }}
            onClick={() => {
              if (interactive && !disabled) onSelect(hotspot.id);
            }}
          />
        );
      })}
    </svg>
  );
}
