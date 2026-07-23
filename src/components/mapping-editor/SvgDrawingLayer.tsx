"use client";

import type { NormalizedPoint } from "@/lib/coordinates";
import { pointsToSvgPath } from "@/lib/mapping/geometry";
import type { EditorRegion } from "@/lib/mapping/types";

type SvgDrawingLayerProps = {
  imageWidth: number;
  imageHeight: number;
  regions: EditorRegion[];
  selectedId: string | null;
  draftPoints: NormalizedPoint[];
  onSelectRegion: (id: string) => void;
};

export function SvgDrawingLayer({
  imageWidth,
  imageHeight,
  regions,
  selectedId,
  draftPoints,
  onSelectRegion,
}: SvgDrawingLayerProps) {
  const viewBox = `0 0 ${imageWidth} ${imageHeight}`;

  return (
    <svg
      className="absolute inset-0 h-full w-full"
      viewBox={viewBox}
      preserveAspectRatio="none"
    >
      {regions.map((region) => {
        const pathPoints = region.points.map((point) => ({
          x: point.x * imageWidth,
          y: point.y * imageHeight,
        }));
        const d = pointsToSvgPath(pathPoints, region.closed);
        const isSelected = region.id === selectedId;
        return (
          <g key={region.id}>
            <path
              d={d}
              fill={
                isSelected
                  ? "rgba(56, 189, 248, 0.35)"
                  : "rgba(250, 204, 21, 0.22)"
              }
              stroke={isSelected ? "#38bdf8" : "#facc15"}
              strokeWidth={
                isSelected ? imageWidth * 0.003 : imageWidth * 0.002
              }
              onClick={(event) => {
                event.stopPropagation();
                onSelectRegion(region.id);
              }}
              style={{ cursor: "pointer" }}
            />
            {isSelected
              ? region.points.map((point, index) => (
                  <circle
                    key={`${region.id}-${index}`}
                    data-region-id={region.id}
                    data-vertex-index={index}
                    cx={point.x * imageWidth}
                    cy={point.y * imageHeight}
                    r={imageWidth * 0.008}
                    fill="#fff"
                    stroke="#0ea5e9"
                    strokeWidth={imageWidth * 0.002}
                    style={{ cursor: "move" }}
                  />
                ))
              : null}
          </g>
        );
      })}
      {draftPoints.length > 0 ? (
        <path
          d={pointsToSvgPath(
            draftPoints.map((point) => ({
              x: point.x * imageWidth,
              y: point.y * imageHeight,
            })),
            false,
          )}
          fill="none"
          stroke="#f472b6"
          strokeWidth={imageWidth * 0.0025}
          strokeDasharray={`${imageWidth * 0.01} ${imageWidth * 0.006}`}
        />
      ) : null}
      {draftPoints.map((point, index) => (
        <circle
          key={`draft-${index}`}
          cx={point.x * imageWidth}
          cy={point.y * imageHeight}
          r={imageWidth * 0.006}
          fill="#f472b6"
        />
      ))}
    </svg>
  );
}
