"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { formatMarkerLabel } from "@/lib/format-marker-label";
import type { SpatialInteractionType } from "@/types/spatial";

export type BuildingRenderFloor = {
  id: string;
  floorNumber: number;
  name: string;
  label: string;
  href: string;
  availableApartmentCount: number;
  markerX: number;
  markerY: number;
  svgPath: string | null;
  interactionType: SpatialInteractionType;
};

type BuildingRenderViewerProps = {
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBox: string;
  buildingName: string;
  floors: BuildingRenderFloor[];
  /** Pre-highlight a floor (e.g. current admin floor). */
  initialActiveFloorId?: string | null;
  /** Hide the side list when embedded in admin. */
  compact?: boolean;
  /** Override default navigation (e.g. open upload panel). */
  onFloorClick?: (floor: BuildingRenderFloor) => void;
};

/**
 * Static building render + SVG floor overlays (no WebGL).
 * Hover → orange band; click → opens that floor's plan / apartments page.
 */
export function BuildingRenderViewer({
  imageUrl,
  imageWidth,
  imageHeight,
  viewBox,
  buildingName,
  floors,
  initialActiveFloorId = null,
  compact = false,
  onFloorClick,
}: BuildingRenderViewerProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(
    initialActiveFloorId,
  );
  const [failedForUrl, setFailedForUrl] = useState<string | null>(null);
  const src =
    failedForUrl === imageUrl
      ? "/buildings/building-render.png"
      : imageUrl;

  const openFloor = (floor: BuildingRenderFloor) => {
    if (onFloorClick) {
      onFloorClick(floor);
      return;
    }
    router.push(floor.href);
  };

  return (
    <div
      className={
        compact
          ? "space-y-3"
          : "grid gap-6 lg:grid-cols-[1fr_280px]"
      }
    >
      <div className="relative overflow-hidden border border-[var(--mp-line)] bg-[#1a1c1f]">
        <div className="relative mx-auto w-full max-w-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${buildingName} render`}
            width={imageWidth}
            height={imageHeight}
            draggable={false}
            className="pointer-events-none h-auto w-full select-none object-contain"
            onError={() => setFailedForUrl(imageUrl)}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            {floors.map((floor) => {
              if (!floor.svgPath) return null;
              const isActive = floor.id === activeId;
              return (
                <path
                  key={`poly-${floor.id}`}
                  d={floor.svgPath}
                  className="cursor-pointer outline-none transition-[fill,stroke-width] duration-150 focus-visible:stroke-white"
                  fill={
                    isActive
                      ? "rgba(224,122,47,0.48)"
                      : "rgba(224,122,47,0.16)"
                  }
                  stroke={isActive ? "#c45c26" : "#e07a2f"}
                  strokeWidth={isActive ? 3 : 1.5}
                  tabIndex={0}
                  role="button"
                  aria-label={`${floor.name} · բացել նկարի upload`}
                  onMouseEnter={() => setActiveId(floor.id)}
                  onMouseLeave={() =>
                    setActiveId(initialActiveFloorId)
                  }
                  onFocus={() => setActiveId(floor.id)}
                  onBlur={() => setActiveId(initialActiveFloorId)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      openFloor(floor);
                    }
                  }}
                  onClick={() => openFloor(floor)}
                />
              );
            })}
          </svg>
          {floors.map((floor) => {
            if (floor.interactionType === "POLYGON") return null;
            const isActive = floor.id === activeId;
            return (
              <button
                key={`marker-${floor.id}`}
                type="button"
                className={`absolute z-10 flex h-5 w-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white text-[10px] font-semibold tracking-wide text-white shadow-[0_2px_6px_rgba(0,0,0,0.35)] transition ${
                  isActive
                    ? "bg-[#d56a20] ring-2 ring-white/80"
                    : "bg-[#e07a2f]"
                }`}
                style={{
                  left: `${floor.markerX * 100}%`,
                  top: `${floor.markerY * 100}%`,
                }}
                onMouseEnter={() => setActiveId(floor.id)}
                onMouseLeave={() => setActiveId(initialActiveFloorId)}
                onClick={() => openFloor(floor)}
              >
                {formatMarkerLabel(floor.label)}
              </button>
            );
          })}
        </div>
        <p className="border-t border-[var(--mp-line)] bg-[var(--mp-panel)] px-3 py-2 text-xs text-[var(--mp-ink-muted)]">
          Hover հարկի վրա → նարնջագույն գոտի · Click → նկար upload / հատակագիծ
        </p>
      </div>

      {compact ? null : (
        <aside className="space-y-3">
          <h3 className="font-[family-name:var(--font-display)] text-xl">
            Հարկեր
          </h3>
          <p className="text-xs text-[var(--mp-ink-muted)]">
            Գոտու վրա hover արա՝ նարնջագույն տեսնելու համար, սեղմիր՝ հատակագիծը
            բացելու համար։
          </p>
          <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
            {floors.map((floor) => {
              const isActive = floor.id === activeId;
              return (
                <li key={floor.id}>
                  <Link
                    href={floor.href}
                    className={`flex items-center justify-between px-3 py-3 text-sm transition ${
                      isActive
                        ? "bg-[var(--mp-panel-hover)]"
                        : "hover:bg-[var(--mp-panel-hover)]"
                    }`}
                    onMouseEnter={() => setActiveId(floor.id)}
                    onMouseLeave={() => setActiveId(initialActiveFloorId)}
                  >
                    <span>
                      <span className="font-medium">{floor.name}</span>
                      <span className="mt-0.5 block text-xs text-[var(--mp-ink-muted)]">
                        {floor.availableApartmentCount} հասանելի
                        {floor.svgPath ? " · mapped" : ""}
                      </span>
                    </span>
                    <span className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
                      Բացել
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </aside>
      )}
    </div>
  );
}
