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
import { EyeIcon, EyeOffIcon } from "@/components/site/EyeIcons";
import { normalizedToPercent } from "@/lib/coordinates";
import { canNavigateSpatialStatus } from "@/lib/spatial-status";
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
  const [isEditing, setIsEditing] = useState(true);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [focusedId, setFocusedId] = useState<string | null>(null);
  const [tooltipPinned, setTooltipPinned] = useState(false);
  const [isCoarsePointer, setIsCoarsePointer] = useState(false);
  const hoverClearTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  useEffect(() => {
    return () => {
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    };
  }, []);

  const buildings = useMemo(
    () => payload.buildings.filter((b) => b.status !== "HIDDEN"),
    [payload.buildings],
  );

  const activeId = hoveredId ?? selectedId ?? focusedId;
  const activeBuilding = buildings.find((b) => b.id === activeId) ?? null;

  const clearInteractionState = useCallback(() => {
    if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    setHoveredId(null);
    setSelectedId(null);
    setFocusedId(null);
    setTooltipPinned(false);
  }, []);

  const exitEditMode = useCallback(() => {
    clearInteractionState();
    controlsRef.current.reset();
    setIsEditing(false);
  }, [clearInteractionState]);

  const enterEditMode = useCallback(() => {
    clearInteractionState();
    setIsEditing(true);
  }, [clearInteractionState]);

  const clearHoverSoon = useCallback(() => {
    if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    hoverClearTimer.current = setTimeout(() => {
      if (!tooltipPinned) setHoveredId(null);
    }, 120);
  }, [tooltipPinned]);

  const onHoverBuilding = useCallback(
    (id: string | null) => {
      if (!isEditing) return;
      if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
      if (id) {
        setHoveredId(id);
        return;
      }
      clearHoverSoon();
    },
    [clearHoverSoon, isEditing],
  );

  const onSelect = useCallback(
    (id: string) => {
      if (!isEditing) return;
      const building = buildings.find((b) => b.id === id);
      if (!building || building.status === "DISABLED") return;

      if (isCoarsePointer) {
        setSelectedId(id);
        setHoveredId(null);
        setTooltipPinned(false);
        return;
      }

      if (!canNavigateSpatialStatus(building.status)) {
        setSelectedId(id);
        setHoveredId(id);
        setTooltipPinned(true);
        return;
      }

      router.push(building.href);
    },
    [buildings, isCoarsePointer, isEditing, router],
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
          interactionEnabled={isEditing}
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
                hoveredId={isEditing ? hoveredId : null}
                selectedId={isEditing ? selectedId : null}
                focusedId={isEditing ? focusedId : null}
                interactive={isEditing}
                onHover={onHoverBuilding}
                onSelect={onSelect}
              />
              {buildings.map((building) => (
                <MasterplanHotspot
                  key={`marker-${building.id}`}
                  hotspot={building}
                  isHovered={isEditing && building.id === hoveredId}
                  isSelected={isEditing && building.id === selectedId}
                  isFocused={isEditing && building.id === focusedId}
                  interactive={isEditing}
                  onHover={onHoverBuilding}
                  onSelect={onSelect}
                  onFocus={isEditing ? setFocusedId : () => undefined}
                />
              ))}
              {isEditing ? (
                <BuildingTooltip
                  building={
                    !isCoarsePointer && (hoveredId || tooltipPinned)
                      ? activeBuilding
                      : null
                  }
                  anchor={tooltipAnchor}
                  visible={
                    !isCoarsePointer &&
                    Boolean(hoveredId || tooltipPinned) &&
                    Boolean(activeBuilding)
                  }
                  onView={onView}
                  onTooltipEnter={() => {
                    if (hoverClearTimer.current)
                      clearTimeout(hoverClearTimer.current);
                    setTooltipPinned(true);
                  }}
                  onTooltipLeave={() => {
                    setTooltipPinned(false);
                    setHoveredId(null);
                    setSelectedId(null);
                  }}
                />
              ) : null}
            </div>
          )}
        </MasterplanViewport>

        <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-30">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center border border-[var(--mp-line)] bg-[var(--mp-panel)] text-[var(--mp-ink)] shadow-sm transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mp-focus)]"
            onClick={() => {
              if (isEditing) exitEditMode();
              else enterEditMode();
            }}
            aria-pressed={isEditing}
            aria-label={
              isEditing
                ? "Վերադառնալ նկարի ռեժիմ"
                : "Բացել ինտերակտիվ ռեժիմ"
            }
            title={isEditing ? "Նկար" : "Ինտերակտիվ"}
          >
            {isEditing ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>

        {isEditing ? (
          <MasterplanControls
            onZoomIn={() => controlsRef.current.zoomIn()}
            onZoomOut={() => controlsRef.current.zoomOut()}
            onReset={() => controlsRef.current.reset()}
          />
        ) : null}

        <BuildingMobileSheet
          building={
            selectedId
              ? (buildings.find((b) => b.id === selectedId) ?? null)
              : null
          }
          open={isEditing && isCoarsePointer && Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
          onView={onView}
        />
      </div>

      <div>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl">
          Շենքեր
        </h2>
        <p className="mb-4 text-sm text-[var(--mp-ink-muted)]">
          Ցանկը համաժամեցված է aerial overlay-ի հետ և հասանելի է ստեղնաշարով՝
          որպես Փուլ 2-ի fallback։
        </p>
        <BuildingList
          buildings={buildings}
          activeId={isEditing ? activeId : null}
          onHover={onHoverBuilding}
        />
      </div>
    </div>
  );
}
