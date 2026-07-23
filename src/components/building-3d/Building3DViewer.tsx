"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { useRouter } from "next/navigation";
import type { Building3DPayload } from "@/types/building-3d";
import { BuildingScene } from "@/components/building-3d/BuildingScene";
import { BuildingTooltip } from "@/components/building-3d/BuildingTooltip";
import { FloorSelector } from "@/components/building-3d/FloorSelector";
import { ViewerToolbar } from "@/components/building-3d/ViewerToolbar";
import { WebGLFallback } from "@/components/building-3d/WebGLFallback";
import { useReducedMotion } from "@/components/building-3d/useReducedMotion";
import { useWebGLSupport } from "@/components/building-3d/useWebGLSupport";

type Building3DViewerProps = {
  payload: Building3DPayload;
};

export function Building3DViewer({ payload }: Building3DViewerProps) {
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const webgl = useWebGLSupport();
  const reducedMotion = useReducedMotion();
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [resetToken, setResetToken] = useState(0);

  const activeFloor = useMemo(() => {
    const id = hoveredId ?? selectedId;
    return payload.floors.find((floor) => floor.id === id) ?? null;
  }, [hoveredId, payload.floors, selectedId]);

  const onConfirm = useCallback(
    (href: string) => {
      router.push(href);
    },
    [router],
  );

  const onFullscreen = useCallback(() => {
    const el = shellRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }
    void el.requestFullscreen();
  }, []);

  if (!webgl) {
    return (
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.75fr]">
        <div className="border border-[var(--mp-line)]">
          <WebGLFallback
            previewImageUrl={payload.building.previewImageUrl}
            message="WebGL հասանելի չէ։ Օգտագործեք աջ կողմի հարկերի ցանկը։"
          />
        </div>
        <FloorSelector
          floors={payload.floors}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={setSelectedId}
          onConfirm={onConfirm}
        />
      </div>
    );
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[1.4fr_0.75fr]">
      <div
        ref={shellRef}
        className="relative h-[min(70dvh,560px)] overflow-hidden border border-[var(--mp-line)] bg-[var(--mp-stage)]"
      >
        <Canvas
          className="absolute inset-0 h-full w-full touch-none"
          style={{ width: "100%", height: "100%", display: "block" }}
          shadows
          camera={{ position: [7.5, 5.5, 7.5], fov: 42, near: 0.1, far: 100 }}
          dpr={[1, 1.5]}
          gl={{ antialias: true, alpha: false }}
          onCreated={({ gl }) => {
            gl.setClearColor("#1c1f1c", 1);
          }}
        >
          <BuildingScene
            model3dUrl={payload.building.model3dUrl}
            floors={payload.floors}
            hoveredId={hoveredId}
            selectedId={selectedId}
            resetToken={resetToken}
            reducedMotion={reducedMotion}
            onHover={setHoveredId}
            onSelect={setSelectedId}
          />
        </Canvas>
        <BuildingTooltip floor={activeFloor} visible={Boolean(activeFloor)} />
        <ViewerToolbar
          onReset={() => setResetToken((value) => value + 1)}
          onFullscreen={onFullscreen}
          loadingProgress={null}
          reducedMotion={reducedMotion}
        />
      </div>

      <div className="min-h-[320px] lg:min-h-[560px]">
        <FloorSelector
          floors={payload.floors}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={setHoveredId}
          onSelect={setSelectedId}
          onConfirm={onConfirm}
        />
      </div>
    </div>
  );
}
