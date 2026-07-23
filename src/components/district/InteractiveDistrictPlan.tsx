"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { BuildingList } from "@/components/district/BuildingList";
import { BuildingMobileSheet } from "@/components/district/BuildingMobileSheet";
import { BuildingTooltip } from "@/components/district/BuildingTooltip";
import { MasterplanControls } from "@/components/masterplan/MasterplanControls";
import { MasterplanHotspot } from "@/components/masterplan/MasterplanHotspot";
import { MasterplanImage } from "@/components/masterplan/MasterplanImage";
import { MasterplanSvgOverlay } from "@/components/masterplan/MasterplanSvgOverlay";
import { MasterplanViewport } from "@/components/masterplan/MasterplanViewport";
import { normalizedToPercent } from "@/lib/coordinates";
import type { DistrictPlanPayload } from "@/types/district-plan";

type InteractiveDistrictPlanProps = {
  payload: DistrictPlanPayload;
};

type ZoomControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

export function InteractiveDistrictPlan({
  payload,
}: InteractiveDistrictPlanProps) {
  const router = useRouter();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const controlsRef = useRef<ZoomControls>({
    zoomIn: () => undefined,
    zoomOut: () => undefined,
    reset: () => undefined,
  });

  useEffect(() => {
    const media = window.matchMedia("(hover: none), (pointer: coarse)");
    const update = () => setIsCoarsePointer(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const buildings = useMemo(
    () => payload.buildings.filter((b) => b.status !== "HIDDEN"),
    [payload.buildings],
  );

  const activeId = hoveredId ?? selectedId ?? focusedId;
  const activeBuilding = buildings.find((b) => b.id === activeId) ?? null;

  const onSelect = useCallback(
    (id: string) => {
      const building = buildings.find((b) => b.id === id);
      if (!building || building.status === "DISABLED") return;

      if (isCoarsePointer) {
        setSelectedId(id);
        setHoveredId(null);
        return;
      }

      if (building.status === "COMING_SOON") {
        setSelectedId(id);
        return;
      }

      router.push(building.href);
    },
    [buildings, isCoarsePointer, router],
  );

  const onView = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  const bindControls = useCallback((controls: ZoomControls) => {
    controlsRef.current = controls;
  }, []);

  const tooltipAnchor = activeBuilding
    ? normalizedToPercent({
        x: activeBuilding.markerX,
        y: activeBuilding.markerY,
      })
    : null;

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden border border-[var(--mp-line)] bg-[var(--mp-stage)]">
        <MasterplanViewport
          imageWidth={payload.asset.width}
          imageHeight={payload.asset.height}
          minZoom={payload.asset.minZoom}
          maxZoom={payload.asset.maxZoom}
          initialZoom={payload.asset.initialZoom}
          onZoomControlsRef={bindControls}
        >
          {({ contentBounds }) => (
            <div
              className="absolute"
              data-district-content-box
              style={{
                left: contentBounds.x,
                top: contentBounds.y,
                width: contentBounds.width,
                height: contentBounds.height,
              }}
            >
              <MasterplanImage
                src={payload.asset.imageUrl}
                alt={`${payload.district.name} aerial plan`}
                width={payload.asset.width}
                height={payload.asset.height}
              />
              <MasterplanSvgOverlay
                viewBox={payload.asset.viewBox}
                hotspots={buildings}
                hoveredId={hoveredId}
                selectedId={selectedId}
                focusedId={focusedId}
                onHover={setHoveredId}
                onSelect={onSelect}
              />
              {buildings.map((building) => (
                <MasterplanHotspot
                  key={`marker-${building.id}`}
                  hotspot={building}
                  isHovered={building.id === hoveredId}
                  isSelected={building.id === selectedId}
                  isFocused={building.id === focusedId}
                  onHover={setHoveredId}
                  onSelect={onSelect}
                  onFocus={setFocusedId}
                />
              ))}
              <BuildingTooltip
                building={!isCoarsePointer && hoveredId ? activeBuilding : null}
                anchor={tooltipAnchor}
                visible={!isCoarsePointer && Boolean(hoveredId)}
                onView={onView}
              />
            </div>
          )}
        </MasterplanViewport>

        <MasterplanControls
          onZoomIn={() => controlsRef.current.zoomIn()}
          onZoomOut={() => controlsRef.current.zoomOut()}
          onReset={() => controlsRef.current.reset()}
        />
        <BuildingMobileSheet
          building={
            selectedId
              ? (buildings.find((b) => b.id === selectedId) ?? null)
              : null
          }
          open={isCoarsePointer && Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
          onView={onView}
        />
      </div>

      <div>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl">
          Շենքեր
        </h2>
        <p className="mb-4 text-sm text-[var(--mp-ink-muted)]">
          Ցանկը համաժամեցված է aerial overlay-ի հետ և հասանելի է ստեղնաշարով։
        </p>
        <BuildingList
          buildings={buildings}
          activeId={activeId}
          onHover={setHoveredId}
        />
      </div>
    </div>
  );
}
