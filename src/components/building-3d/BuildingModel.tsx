"use client";

import { Suspense, useEffect, useMemo } from "react";
import { useGLTF } from "@react-three/drei";
import type { BuildingFloor3D } from "@/types/building-3d";
import { FloorMesh } from "@/components/building-3d/FloorMesh";
import * as THREE from "three";

type BuildingModelProps = {
  model3dUrl: string | null;
  floors: BuildingFloor3D[];
  hoveredId: string | null;
  selectedId: string | null;
  reducedMotion: boolean;
  onHover: (floorId: string | null) => void;
  onSelect: (floorId: string) => void;
};

function ProceduralBuilding({
  floors,
  hoveredId,
  selectedId,
  reducedMotion,
  onHover,
  onSelect,
}: Omit<BuildingModelProps, "model3dUrl">) {
  const slabHeight = 0.55;
  const gap = 0.12;

  return (
    <group name="Building_01">
      <mesh name="Ground" position={[0, -0.2, 0]} receiveShadow>
        <boxGeometry args={[5.2, 0.2, 4.2]} />
        <meshStandardMaterial color="#8d948a" roughness={0.9} />
      </mesh>

      {floors.map((floor, index) => (
        <FloorMesh
          key={floor.id}
          meshName={floor.meshName}
          floorId={floor.id}
          positionY={index * (slabHeight + gap) + slabHeight / 2}
          isHovered={hoveredId === floor.id}
          isSelected={selectedId === floor.id}
          reducedMotion={reducedMotion}
          onHover={onHover}
          onSelect={onSelect}
        />
      ))}

      <mesh
        name="Roof"
        position={[0, floors.length * (slabHeight + gap) + 0.15, 0]}
        castShadow
      >
        <boxGeometry args={[4.4, 0.25, 3.4]} />
        <meshStandardMaterial color="#6d675c" roughness={0.8} />
      </mesh>
    </group>
  );
}

function GlbBuilding({
  model3dUrl,
  floors,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: {
  model3dUrl: string;
  floors: BuildingFloor3D[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (floorId: string | null) => void;
  onSelect: (floorId: string) => void;
}) {
  const gltf = useGLTF(model3dUrl);
  const floorByMesh = useMemo(() => {
    const map = new Map<string, BuildingFloor3D>();
    for (const floor of floors) map.set(floor.meshName, floor);
    return map;
  }, [floors]);

  const root = useMemo(() => {
    const cloned = gltf.scene.clone(true);
    cloned.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      if (Array.isArray(mesh.material)) {
        mesh.material = mesh.material.map((mat) => mat.clone());
      } else if (mesh.material) {
        mesh.material = mesh.material.clone();
      }
    });
    return cloned;
  }, [gltf.scene]);

  useEffect(() => {
    root.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (!mesh.isMesh) return;
      const floor = floorByMesh.get(mesh.name);
      mesh.userData.floorId = floor?.id ?? null;

      if (!floor) return;
      const mats = Array.isArray(mesh.material)
        ? mesh.material
        : [mesh.material];
      for (const mat of mats) {
        const std = mat as THREE.MeshStandardMaterial;
        if (!("color" in std) || !std.color) continue;
        if (selectedId === floor.id) std.color.set("#8a7348");
        else if (hoveredId === floor.id) std.color.set("#c4a878");
        else std.color.set("#d8d2c6");
      }
    });
  }, [root, floorByMesh, hoveredId, selectedId]);

  return (
    <group
      onPointerMissed={() => onHover(null)}
      onPointerOver={(event) => {
        event.stopPropagation();
        const floorId = event.object.userData.floorId as string | null;
        onHover(floorId);
      }}
      onPointerOut={() => onHover(null)}
      onClick={(event) => {
        event.stopPropagation();
        const floorId = event.object.userData.floorId as string | null;
        if (floorId) onSelect(floorId);
      }}
    >
      <primitive object={root} />
    </group>
  );
}

export function BuildingModel(props: BuildingModelProps) {
  if (props.model3dUrl) {
    return (
      <Suspense fallback={null}>
        <GlbBuilding
          model3dUrl={props.model3dUrl}
          floors={props.floors}
          hoveredId={props.hoveredId}
          selectedId={props.selectedId}
          onHover={props.onHover}
          onSelect={props.onSelect}
        />
      </Suspense>
    );
  }

  return (
    <ProceduralBuilding
      floors={props.floors}
      hoveredId={props.hoveredId}
      selectedId={props.selectedId}
      reducedMotion={props.reducedMotion}
      onHover={props.onHover}
      onSelect={props.onSelect}
    />
  );
}
