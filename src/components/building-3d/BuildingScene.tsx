"use client";

import { ContactShadows } from "@react-three/drei";
import type { BuildingFloor3D } from "@/types/building-3d";
import { BuildingModel } from "@/components/building-3d/BuildingModel";
import { CameraController } from "@/components/building-3d/CameraController";

type BuildingSceneProps = {
  model3dUrl: string | null;
  floors: BuildingFloor3D[];
  hoveredId: string | null;
  selectedId: string | null;
  resetToken: number;
  reducedMotion: boolean;
  onHover: (floorId: string | null) => void;
  onSelect: (floorId: string) => void;
};

/**
 * Local lighting only — no CDN Environment HDR (that was causing the broken
 * image icon and blank viewer when the remote asset failed).
 */
export function BuildingScene({
  model3dUrl,
  floors,
  hoveredId,
  selectedId,
  resetToken,
  reducedMotion,
  onHover,
  onSelect,
}: BuildingSceneProps) {
  return (
    <>
      <color attach="background" args={["#1c1f1c"]} />
      <hemisphereLight args={["#f0ebe3", "#3a3f3a", 0.85]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        position={[6, 10, 4]}
        intensity={1.25}
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-4, 3, -2]} intensity={0.35} />
      <CameraController resetToken={resetToken} reducedMotion={reducedMotion} />
      <BuildingModel
        model3dUrl={model3dUrl}
        floors={floors}
        hoveredId={hoveredId}
        selectedId={selectedId}
        reducedMotion={reducedMotion}
        onHover={onHover}
        onSelect={onSelect}
      />
      <ContactShadows
        position={[0, -0.21, 0]}
        opacity={0.4}
        scale={14}
        blur={2.2}
        far={8}
      />
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.22, 0]}
        receiveShadow
      >
        <circleGeometry args={[8, 48]} />
        <meshStandardMaterial color="#2a2e2a" roughness={1} />
      </mesh>
    </>
  );
}
