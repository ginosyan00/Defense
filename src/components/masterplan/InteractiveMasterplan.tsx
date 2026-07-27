"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { MasterplanControls } from "@/components/masterplan/MasterplanControls";
import { MasterplanHotspot } from "@/components/masterplan/MasterplanHotspot";
import { MasterplanImage } from "@/components/masterplan/MasterplanImage";
import { MasterplanLegend } from "@/components/masterplan/MasterplanLegend";
import { MasterplanMobileSheet } from "@/components/masterplan/MasterplanMobileSheet";
import { MasterplanSvgOverlay } from "@/components/masterplan/MasterplanSvgOverlay";
import { MasterplanTooltip } from "@/components/masterplan/MasterplanTooltip";
import { MasterplanViewport } from "@/components/masterplan/MasterplanViewport";
import { normalizedToPercent } from "@/lib/coordinates";
import { canNavigateSpatialStatus } from "@/lib/spatial-status";
import type { MasterplanPayload } from "@/types/masterplan";

type InteractiveMasterplanProps = {
  payload: MasterplanPayload;
};

type ZoomControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

export function InteractiveMasterplan({ payload }: InteractiveMasterplanProps) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
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

  const visibleHotspots = useMemo(
    () => payload.hotspots.filter((h) => h.status !== "HIDDEN"),
    [payload.hotspots],
  );

  const activeId = hoveredId ?? selectedId ?? focusedId;
  const activeHotspot =
    visibleHotspots.find((h) => h.id === activeId) ?? null;

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

  const onHoverHotspot = useCallback(
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

  const legendCounts = useMemo(
    () => ({
      availableCount: visibleHotspots.filter((h) => h.status === "AVAILABLE")
        .length,
      comingSoonCount: visibleHotspots.filter((h) => h.status === "COMING_SOON")
        .length,
      soldOutCount: visibleHotspots.filter((h) => h.status === "SOLD_OUT")
        .length,
    }),
    [visibleHotspots],
  );

  const onSelect = useCallback(
    (id: string) => {
      if (!isEditing) return;
      const hotspot = visibleHotspots.find((h) => h.id === id);
      if (!hotspot || hotspot.status === "DISABLED") return;

      if (isCoarsePointer) {
        setSelectedId(id);
        setHoveredId(null);
        setTooltipPinned(false);
        return;
      }

      if (!canNavigateSpatialStatus(hotspot.status)) {
        setSelectedId(id);
        setHoveredId(id);
        setTooltipPinned(true);
        return;
      }

      router.push(hotspot.href);
    },
    [isCoarsePointer, isEditing, router, visibleHotspots],
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

  const tooltipAnchor = activeHotspot
    ? normalizedToPercent({
        x: activeHotspot.markerX,
        y: activeHotspot.markerY,
      })
    : null;

  return (
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
            data-masterplan-content-box
            style={{
              left: contentBounds.x,
              top: contentBounds.y,
              width: contentBounds.width,
              height: contentBounds.height,
            }}
          >
            <MasterplanImage
              src={payload.asset.imageUrl}
              alt={`${payload.project.name} aerial masterplan`}
              width={payload.asset.width}
              height={payload.asset.height}
            />
            <MasterplanSvgOverlay
              viewBox={payload.asset.viewBox}
              hotspots={visibleHotspots}
              hoveredId={isEditing ? hoveredId : null}
              selectedId={isEditing ? selectedId : null}
              focusedId={isEditing ? focusedId : null}
              interactive={isEditing}
              onHover={onHoverHotspot}
              onSelect={onSelect}
            />
            {visibleHotspots.map((hotspot) => (
              <MasterplanHotspot
                key={`marker-${hotspot.id}`}
                hotspot={hotspot}
                isHovered={isEditing && hotspot.id === hoveredId}
                isSelected={isEditing && hotspot.id === selectedId}
                isFocused={isEditing && hotspot.id === focusedId}
                interactive={isEditing}
                onHover={onHoverHotspot}
                onSelect={onSelect}
                onFocus={isEditing ? setFocusedId : () => undefined}
              />
            ))}
            {isEditing ? (
              <MasterplanTooltip
                hotspot={
                  !isCoarsePointer && (hoveredId || tooltipPinned)
                    ? activeHotspot
                    : null
                }
                anchor={tooltipAnchor}
                visible={
                  !isCoarsePointer &&
                  Boolean(hoveredId || tooltipPinned) &&
                  Boolean(activeHotspot)
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

      <MasterplanLegend {...legendCounts} />

      <div className="absolute top-[max(1rem,env(safe-area-inset-top))] right-[max(1rem,env(safe-area-inset-right))] z-30">
        <button
          type="button"
          className="flex h-10 w-10 items-center justify-center border border-[var(--mp-line)] bg-[var(--mp-panel)] text-[var(--mp-ink)] shadow-sm transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mp-focus)]"
          onClick={() => {
            if (isEditing) exitEditMode();
            else enterEditMode();
          }}
          aria-pressed={isEditing}
          aria-label={isEditing ? "Վերադառնալ նկարի ռեժիմ" : "Բացել ինտերակտիվ ռեժիմ"}
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

      <MasterplanMobileSheet
        hotspot={
          selectedId
            ? (visibleHotspots.find((h) => h.id === selectedId) ?? null)
            : null
        }
        open={isEditing && isCoarsePointer && Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onView={onView}
      />
    </div>
  );
}

function EyeIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d="M3 3l18 18" />
      <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
      <path d="M9.9 5.1A10.5 10.5 0 0 1 12 5c6.5 0 10 7 10 7a17.6 17.6 0 0 1-3.2 4.4" />
      <path d="M6.1 6.1C3.9 7.7 2 12 2 12s3.5 7 10 7a10.2 10.2 0 0 0 4.4-1" />
    </svg>
  );
}
