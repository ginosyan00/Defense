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

  const visibleHotspots = useMemo(
    () => payload.hotspots.filter((h) => h.status !== "HIDDEN"),
    [payload.hotspots],
  );

  const activeId = hoveredId ?? selectedId ?? focusedId;
  const activeHotspot =
    visibleHotspots.find((h) => h.id === activeId) ?? null;

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
      const hotspot = visibleHotspots.find((h) => h.id === id);
      if (!hotspot || hotspot.status === "DISABLED") return;

      if (isCoarsePointer) {
        setSelectedId(id);
        setHoveredId(null);
        return;
      }

      if (hotspot.status === "COMING_SOON") {
        setSelectedId(id);
        return;
      }

      router.push(hotspot.href);
    },
    [isCoarsePointer, router, visibleHotspots],
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
              hoveredId={hoveredId}
              selectedId={selectedId}
              focusedId={focusedId}
              onHover={setHoveredId}
              onSelect={onSelect}
            />
            {visibleHotspots.map((hotspot) => (
              <MasterplanHotspot
                key={`marker-${hotspot.id}`}
                hotspot={hotspot}
                isHovered={hotspot.id === hoveredId}
                isSelected={hotspot.id === selectedId}
                isFocused={hotspot.id === focusedId}
                onHover={setHoveredId}
                onSelect={onSelect}
                onFocus={setFocusedId}
              />
            ))}
            <MasterplanTooltip
              hotspot={!isCoarsePointer && hoveredId ? activeHotspot : null}
              anchor={tooltipAnchor}
              visible={!isCoarsePointer && Boolean(hoveredId)}
              onView={onView}
            />
          </div>
        )}
      </MasterplanViewport>

      <MasterplanLegend {...legendCounts} />
      <MasterplanControls
        onZoomIn={() => controlsRef.current.zoomIn()}
        onZoomOut={() => controlsRef.current.zoomOut()}
        onReset={() => controlsRef.current.reset()}
      />
      <MasterplanMobileSheet
        hotspot={
          selectedId
            ? (visibleHotspots.find((h) => h.id === selectedId) ?? null)
            : null
        }
        open={isCoarsePointer && Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        onView={onView}
      />
    </div>
  );
}
