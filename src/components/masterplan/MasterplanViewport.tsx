"use client";

import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
  type WheelEvent,
} from "react";
import { getContainedImageBounds, type Rect } from "@/lib/coordinates";
import {
  DRAG_THRESHOLD_PX,
  clampScale,
  createIdentityTransform,
  toCssTransform,
  zoomAtPoint,
  type ViewportTransform,
} from "@/lib/viewport-transform";

type MasterplanViewportProps = {
  imageWidth: number;
  imageHeight: number;
  minZoom: number;
  maxZoom: number;
  initialZoom: number;
  /** When false, pan/zoom/keyboard are locked — viewport acts like a still image. */
  interactionEnabled?: boolean;
  children: (args: {
    contentBounds: Rect;
    transformStyle: string;
    reducedMotion: boolean;
  }) => ReactNode;
  onResetRequestRef?: (reset: () => void) => void;
  onZoomControlsRef?: (controls: {
    zoomIn: () => void;
    zoomOut: () => void;
    reset: () => void;
  }) => void;
};

export function MasterplanViewport({
  imageWidth,
  imageHeight,
  minZoom,
  maxZoom,
  initialZoom,
  interactionEnabled = true,
  children,
  onZoomControlsRef,
}: MasterplanViewportProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const transformLayerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ViewportTransform>(
    createIdentityTransform(initialZoom),
  );
  const [contentBounds, setContentBounds] = useState<Rect>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [transformStyle, setTransformStyle] = useState(() =>
    toCssTransform(createIdentityTransform(initialZoom)),
  );
  const [reducedMotion, setReducedMotion] = useState(false);

  const dragRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    originX: number;
    originY: number;
    moved: boolean;
  } | null>(null);

  const applyTransform = useCallback((next: ViewportTransform) => {
    transformRef.current = next;
    const css = toCssTransform(next);
    if (transformLayerRef.current) {
      transformLayerRef.current.style.transform = css;
    }
  }, []);

  const commitTransformStyle = useCallback(() => {
    setTransformStyle(toCssTransform(transformRef.current));
  }, []);

  const measure = useCallback(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const bounds = getContainedImageBounds(
      { width: rect.width, height: rect.height },
      { width: imageWidth, height: imageHeight },
    );
    setContentBounds(bounds);
  }, [imageHeight, imageWidth]);

  useEffect(() => {
    measure();
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => measure());
    observer.observe(el);
    return () => observer.disconnect();
  }, [measure]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  const reset = useCallback(() => {
    applyTransform(createIdentityTransform(initialZoom));
    commitTransformStyle();
  }, [applyTransform, commitTransformStyle, initialZoom]);

  const zoomBy = useCallback(
    (factor: number, origin?: { x: number; y: number }) => {
      const el = viewportRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const point = origin ?? { x: rect.width / 2, y: rect.height / 2 };
      const nextScale = clampScale(
        transformRef.current.scale * factor,
        minZoom,
        maxZoom,
      );
      applyTransform(zoomAtPoint(transformRef.current, nextScale, point));
      commitTransformStyle();
    },
    [applyTransform, commitTransformStyle, maxZoom, minZoom],
  );

  useEffect(() => {
    onZoomControlsRef?.({
      zoomIn: () => zoomBy(1.2),
      zoomOut: () => zoomBy(1 / 1.2),
      reset,
    });
  }, [onZoomControlsRef, reset, zoomBy]);

  const onWheel = (event: WheelEvent<HTMLDivElement>) => {
    if (!interactionEnabled) return;
    event.preventDefault();
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const factor = event.deltaY < 0 ? 1.1 : 1 / 1.1;
    zoomBy(factor, {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    });
  };

  const onPointerDown = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactionEnabled) return;
    if (event.button !== 0) return;
    const target = event.target as HTMLElement;
    if (
      target.closest(
        "[data-hotspot], [data-apartment-id], button, a, [role='button']",
      )
    ) {
      return;
    }

    dragRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      originX: transformRef.current.x,
      originY: transformRef.current.y,
      moved: false,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onPointerMove = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!interactionEnabled) return;
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    const dx = event.clientX - drag.startX;
    const dy = event.clientY - drag.startY;
    if (!drag.moved && Math.hypot(dx, dy) >= DRAG_THRESHOLD_PX) {
      drag.moved = true;
    }
    if (!drag.moved) return;
    applyTransform({
      ...transformRef.current,
      x: drag.originX + dx,
      y: drag.originY + dy,
    });
  };

  const onPointerUp = (event: ReactPointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    dragRef.current = null;
    commitTransformStyle();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!interactionEnabled) return;
    const step = 40;
    if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      zoomBy(1.2);
    } else if (event.key === "-" || event.key === "_") {
      event.preventDefault();
      zoomBy(1 / 1.2);
    } else if (event.key === "0") {
      event.preventDefault();
      reset();
    } else if (event.key === "ArrowLeft") {
      event.preventDefault();
      applyTransform({
        ...transformRef.current,
        x: transformRef.current.x + step,
      });
      commitTransformStyle();
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      applyTransform({
        ...transformRef.current,
        x: transformRef.current.x - step,
      });
      commitTransformStyle();
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      applyTransform({
        ...transformRef.current,
        y: transformRef.current.y + step,
      });
      commitTransformStyle();
    } else if (event.key === "ArrowDown") {
      event.preventDefault();
      applyTransform({
        ...transformRef.current,
        y: transformRef.current.y - step,
      });
      commitTransformStyle();
    }
  };

  const labelId = useId();

  return (
    <div
      ref={viewportRef}
      className={`masterplan-viewport relative h-[min(78dvh,820px)] w-full overflow-hidden bg-[var(--mp-stage)] outline-none ${
        interactionEnabled ? "touch-none" : "touch-auto"
      }`}
      role={interactionEnabled ? "application" : "img"}
      aria-roledescription={
        interactionEnabled ? "Interactive masterplan" : undefined
      }
      aria-labelledby={labelId}
      tabIndex={interactionEnabled ? 0 : undefined}
      onWheel={onWheel}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onKeyDown={onKeyDown}
    >
      <span id={labelId} className="sr-only">
        {interactionEnabled
          ? "Project aerial masterplan. Use arrow keys to pan, plus and minus to zoom, zero to reset."
          : "Project aerial masterplan preview image."}
      </span>
      <div
        ref={transformLayerRef}
        className="absolute inset-0 origin-top-left will-change-transform"
        style={{
          transform: transformStyle,
          transition: reducedMotion ? undefined : "transform 120ms ease-out",
        }}
        data-masterplan-transform-root
      >
        {children({ contentBounds, transformStyle, reducedMotion })}
      </div>
    </div>
  );
}
