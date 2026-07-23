"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ApartmentList } from "@/components/floor/ApartmentList";
import { FloorPlanMobileSheet } from "@/components/floor/FloorPlanMobileSheet";
import { FloorPlanSvg } from "@/components/floor/FloorPlanSvg";
import { FloorPlanTooltip } from "@/components/floor/FloorPlanTooltip";
import { MasterplanControls } from "@/components/masterplan/MasterplanControls";
import { MasterplanViewport } from "@/components/masterplan/MasterplanViewport";
import type { FloorPlanPayload } from "@/types/floor-plan";

type InteractiveFloorPlanProps = {
  payload: FloorPlanPayload;
};

type ZoomControls = {
  zoomIn: () => void;
  zoomOut: () => void;
  reset: () => void;
};

export function InteractiveFloorPlan({ payload }: InteractiveFloorPlanProps) {
  const router = useRouter();
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

  const apartments = useMemo(
    () => payload.apartments.filter((apt) => apt.status !== "HIDDEN"),
    [payload.apartments],
  );

  const activeId = hoveredId ?? selectedId ?? focusedId;
  const activeApartment = apartments.find((apt) => apt.id === activeId) ?? null;

  const clearHoverSoon = useCallback(() => {
    if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    hoverClearTimer.current = setTimeout(() => {
      if (!tooltipPinned) setHoveredId(null);
    }, 120);
  }, [tooltipPinned]);

  const onHoverApartment = useCallback((id: string | null) => {
    if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
    if (id) {
      setHoveredId(id);
      return;
    }
    clearHoverSoon();
  }, [clearHoverSoon]);

  const onSelect = useCallback(
    (id: string) => {
      const apartment = apartments.find((apt) => apt.id === id);
      if (!apartment) return;

      // Touch / coarse: first tap opens sheet; navigate via CTA.
      if (isCoarsePointer) {
        setSelectedId(id);
        setHoveredId(null);
        return;
      }

      if (apartment.status === "SOLD") {
        setSelectedId(id);
        return;
      }

      router.push(apartment.href);
    },
    [apartments, isCoarsePointer, router],
  );

  const bindControls = useCallback((controls: ZoomControls) => {
    controlsRef.current = controls;
  }, []);

  const tooltipVisible =
    !isCoarsePointer && Boolean(hoveredId || tooltipPinned) && Boolean(activeApartment);

  return (
    <div className="space-y-6">
      <div className="relative overflow-hidden border border-[var(--mp-line)] bg-[var(--mp-stage)]">
        <MasterplanViewport
          imageWidth={payload.floor.width}
          imageHeight={payload.floor.height}
          minZoom={1}
          maxZoom={4}
          initialZoom={1}
          onZoomControlsRef={bindControls}
        >
          {({ contentBounds }) => (
            <div
              className="absolute"
              data-floorplan-content-box
              style={{
                left: contentBounds.x,
                top: contentBounds.y,
                width: contentBounds.width,
                height: contentBounds.height,
              }}
            >
              <FloorPlanSvg
                viewBox={payload.floor.viewBox}
                apartments={apartments}
                hoveredId={hoveredId}
                selectedId={selectedId}
                focusedId={focusedId}
                onHover={onHoverApartment}
                onSelect={onSelect}
                onFocus={setFocusedId}
                backgroundImageUrl={payload.floor.imageUrl}
              />
              <FloorPlanTooltip
                apartment={activeApartment}
                visible={tooltipVisible}
                onTooltipEnter={() => {
                  if (hoverClearTimer.current) clearTimeout(hoverClearTimer.current);
                  setTooltipPinned(true);
                }}
                onTooltipLeave={() => {
                  setTooltipPinned(false);
                  setHoveredId(null);
                }}
              />
            </div>
          )}
        </MasterplanViewport>

        <MasterplanControls
          onZoomIn={() => controlsRef.current.zoomIn()}
          onZoomOut={() => controlsRef.current.zoomOut()}
          onReset={() => controlsRef.current.reset()}
        />
        <FloorPlanMobileSheet
          apartment={
            selectedId
              ? (apartments.find((apt) => apt.id === selectedId) ?? null)
              : null
          }
          open={isCoarsePointer && Boolean(selectedId)}
          onClose={() => setSelectedId(null)}
        />
      </div>

      <div>
        <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl">
          Բնակարաններ
        </h2>
        <p className="mb-4 text-sm text-[var(--mp-ink-muted)]">
          Կարգավիճակը ցուցադրվում է տեքստով և pattern-ով։ Վաճառված բնակարանը
          չի կարող ամրագրվել։
          {apartments.every((apt) => !apt.svgPath)
            ? " Admin-ում դեռ գծագիր չկա — գծիր բնակարանների տարածքները։"
            : ""}
        </p>
        <ApartmentList
          apartments={apartments}
          activeId={activeId}
          onHover={setHoveredId}
        />
      </div>
    </div>
  );
}
