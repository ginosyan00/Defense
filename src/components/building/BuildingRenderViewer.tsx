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
};

/**
 * Static building render + SVG floor overlays (no WebGL).
 */
export function BuildingRenderViewer({
  imageUrl,
  imageWidth,
  imageHeight,
  viewBox,
  buildingName,
  floors,
}: BuildingRenderViewerProps) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [failedForUrl, setFailedForUrl] = useState<string | null>(null);
  const src =
    failedForUrl === imageUrl
      ? "/buildings/building-render.png"
      : imageUrl;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
      <div className="relative overflow-hidden border border-[var(--mp-line)] bg-[#1a1c1f]">
        <div className="relative mx-auto w-full max-w-[560px]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={`${buildingName} render`}
            width={imageWidth}
            height={imageHeight}
            className="h-auto w-full object-contain"
            onError={() => setFailedForUrl(imageUrl)}
          />
          <svg
            className="absolute inset-0 h-full w-full"
            viewBox={viewBox}
            preserveAspectRatio="xMidYMid meet"
          >
            {floors.map((floor) => {
              if (floor.interactionType === "MARKER" || !floor.svgPath) {
                return null;
              }
              const isActive = floor.id === activeId;
              return (
                <path
                  key={`poly-${floor.id}`}
                  d={floor.svgPath}
                  className="cursor-pointer outline-none focus-visible:stroke-[var(--mp-focus)]"
                  fill={
                    isActive
                      ? "rgba(214, 190, 140, 0.42)"
                      : "rgba(214, 190, 140, 0.16)"
                  }
                  stroke={
                    isActive
                      ? "rgba(245, 232, 205, 0.95)"
                      : "rgba(138, 115, 72, 0.55)"
                  }
                  strokeWidth={isActive ? 3 : 1.5}
                  tabIndex={0}
                  role="button"
                  aria-label={floor.name}
                  onMouseEnter={() => setActiveId(floor.id)}
                  onMouseLeave={() => setActiveId(null)}
                  onFocus={() => setActiveId(floor.id)}
                  onBlur={() => setActiveId(null)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      router.push(floor.href);
                    }
                  }}
                  onClick={() => router.push(floor.href)}
                />
              );
            })}
          </svg>
          {floors.map((floor) => {
            if (floor.interactionType === "POLYGON") return null;
            return (
              <button
                key={`marker-${floor.id}`}
                type="button"
                className={`absolute z-10 flex h-7 w-7 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white text-xs font-semibold tracking-wide text-white shadow-[0_3px_10px_rgba(0,0,0,0.35)] ${
                  floor.id === activeId
                    ? "bg-[#d56a20] ring-2 ring-white/80"
                    : "bg-[#e07a2f]"
                }`}
                style={{
                  left: `${floor.markerX * 100}%`,
                  top: `${floor.markerY * 100}%`,
                }}
                onMouseEnter={() => setActiveId(floor.id)}
                onMouseLeave={() => setActiveId(null)}
                onClick={() => router.push(floor.href)}
              >
                {formatMarkerLabel(floor.label)}
              </button>
            );
          })}
        </div>
      </div>

      <aside className="space-y-3">
        <h3 className="font-[family-name:var(--font-display)] text-xl">
          Հարկեր
        </h3>
        <p className="text-xs text-[var(--mp-ink-muted)]">
          Սովորական նկար · հարկերի polygon-ները clickable են։
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
                  onMouseLeave={() => setActiveId(null)}
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
    </div>
  );
}
