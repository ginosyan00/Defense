"use client";

import type { FloorApartmentContract } from "@/types/floor-plan";
import {
  apartmentFill,
  apartmentStatusLabel,
  formatMoney,
} from "@/lib/floor/apartment-status";
import { FLOOR_CORE_PATH } from "@/lib/floor/layout";

type FloorPlanSvgProps = {
  viewBox: string;
  apartments: FloorApartmentContract[];
  hoveredId: string | null;
  selectedId: string | null;
  focusedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onFocus: (id: string | null) => void;
  /** When set, skip procedural plate and draw overlays on transparent SVG. */
  backgroundImageUrl?: string | null;
};

export function FloorPlanSvg({
  viewBox,
  apartments,
  hoveredId,
  selectedId,
  focusedId,
  onHover,
  onSelect,
  onFocus,
  backgroundImageUrl = null,
}: FloorPlanSvgProps) {
  const activeId = hoveredId ?? selectedId ?? focusedId;
  const useRaster = Boolean(backgroundImageUrl);

  return (
    <svg
      className="h-full w-full"
      viewBox={viewBox}
      role="group"
      aria-label="Հարկի հատակագիծ"
    >
      <defs>
        <pattern
          id="sold-hatch"
          width="8"
          height="8"
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <line
            x1="0"
            y1="0"
            x2="0"
            y2="8"
            stroke="rgba(60,60,58,0.55)"
            strokeWidth="2"
          />
        </pattern>
        <pattern
          id="reserved-dots"
          width="10"
          height="10"
          patternUnits="userSpaceOnUse"
        >
          <circle cx="2" cy="2" r="1.2" fill="rgba(90,80,50,0.45)" />
        </pattern>
      </defs>

      {useRaster ? (
        <image
          href={backgroundImageUrl ?? undefined}
          x="0"
          y="0"
          width="100%"
          height="100%"
          preserveAspectRatio="none"
        />
      ) : (
        <>
          <rect width="100%" height="100%" fill="#ece8df" />
          <path
            d={FLOOR_CORE_PATH}
            fill="#d7d2c6"
            stroke="#9a958c"
            strokeWidth="2"
          />
        </>
      )}

      {activeId ? (
        <rect width="100%" height="100%" fill="rgba(20,22,20,0.18)" />
      ) : null}

      {apartments.map((apartment) => {
        if (!apartment.svgPath) return null;

        const isActive =
          apartment.id === hoveredId ||
          apartment.id === selectedId ||
          apartment.id === focusedId;
        const interactive = apartment.status === "AVAILABLE" || apartment.status === "RESERVED";
        const sold = apartment.status === "SOLD";
        const path = apartment.svgPath;

        return (
          <g key={apartment.id}>
            <path
              id={apartment.svgElementId}
              data-apartment-id={apartment.id}
              d={path}
              fill={apartmentFill(apartment.status, isActive)}
              stroke={isActive ? "#8a7348" : "#6d675c"}
              strokeWidth={isActive ? 3 : 1.5}
              className={
                interactive || sold
                  ? "cursor-pointer outline-none"
                  : "pointer-events-none"
              }
              tabIndex={interactive || sold ? 0 : -1}
              role="button"
              aria-label={`Բնակարան ${apartment.apartmentNumber}, ${apartmentStatusLabel(apartment.status)}, ${apartment.totalArea} մ², ${formatMoney(apartment.price, apartment.currency)}`}
              aria-pressed={apartment.id === selectedId}
              onMouseEnter={() => onHover(apartment.id)}
              onMouseLeave={() => onHover(null)}
              onFocus={() => onFocus(apartment.id)}
              onBlur={() => onFocus(null)}
              onPointerDown={(event) => {
                event.stopPropagation();
              }}
              onClick={(event) => {
                event.stopPropagation();
                onSelect(apartment.id);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(apartment.id);
                }
              }}
            />
            {apartment.status === "SOLD" ? (
              <path
                d={path}
                fill="url(#sold-hatch)"
                className="pointer-events-none"
              />
            ) : null}
            {apartment.status === "RESERVED" ? (
              <path
                d={path}
                fill="url(#reserved-dots)"
                className="pointer-events-none"
              />
            ) : null}
            <text
              x={centroidX(path)}
              y={centroidY(path) - 8}
              textAnchor="middle"
              className="pointer-events-none select-none"
              fill="#1a1c19"
              fontSize="28"
              fontFamily="var(--font-display), Georgia, serif"
            >
              {apartment.apartmentNumber}
            </text>
            <text
              x={centroidX(path)}
              y={centroidY(path) + 18}
              textAnchor="middle"
              className="pointer-events-none select-none"
              fill="#5f645c"
              fontSize="16"
            >
              {apartmentStatusLabel(apartment.status)}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

/** Approximate centroid from simple rect-like path bounding box midpoints. */
function centroidX(path: string): number {
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const xs = nums.filter((_, i) => i % 2 === 0);
  if (xs.length === 0) return 0;
  return (Math.min(...xs) + Math.max(...xs)) / 2;
}

function centroidY(path: string): number {
  const nums = path.match(/-?\d+(\.\d+)?/g)?.map(Number) ?? [];
  const ys = nums.filter((_, i) => i % 2 === 1);
  if (ys.length === 0) return 0;
  return (Math.min(...ys) + Math.max(...ys)) / 2;
}
