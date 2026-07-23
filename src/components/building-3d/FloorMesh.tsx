"use client";

import { useEffect, useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Mesh, MeshStandardMaterial } from "three";
import * as THREE from "three";

type FloorMeshProps = {
  meshName: string;
  floorId: string;
  positionY: number;
  width?: number;
  depth?: number;
  height?: number;
  isHovered: boolean;
  isSelected: boolean;
  reducedMotion: boolean;
  onHover: (floorId: string | null) => void;
  onSelect: (floorId: string) => void;
};

/**
 * Isolated floor slab with cloned materials so hover never recolors siblings.
 */
export function FloorMesh({
  meshName,
  floorId,
  positionY,
  width = 4.2,
  depth = 3.2,
  height = 0.55,
  isHovered,
  isSelected,
  reducedMotion,
  onHover,
  onSelect,
}: FloorMeshProps) {
  const meshRef = useRef<Mesh>(null);
  const baseColor = useMemo(() => new THREE.Color("#d8d2c6"), []);
  const hoverColor = useMemo(() => new THREE.Color("#c4a878"), []);
  const selectedColor = useMemo(() => new THREE.Color("#8a7348"), []);

  const material = useMemo(() => {
    return new THREE.MeshStandardMaterial({
      color: baseColor.clone(),
      roughness: 0.72,
      metalness: 0.05,
    });
  }, [baseColor]);

  useEffect(() => {
    return () => {
      material.dispose();
    };
  }, [material]);

  useFrame(() => {
    const mat = material as MeshStandardMaterial;
    const target = isSelected
      ? selectedColor
      : isHovered
        ? hoverColor
        : baseColor;
    if (reducedMotion) {
      mat.color.copy(target);
      return;
    }
    mat.color.lerp(target, 0.18);
  });

  return (
    <mesh
      ref={meshRef}
      name={meshName}
      position={[0, positionY, 0]}
      castShadow
      receiveShadow
      material={material}
      onPointerOver={(event) => {
        event.stopPropagation();
        onHover(floorId);
      }}
      onPointerOut={(event) => {
        event.stopPropagation();
        onHover(null);
      }}
      onClick={(event) => {
        event.stopPropagation();
        onSelect(floorId);
      }}
    >
      <boxGeometry args={[width, height, depth]} />
    </mesh>
  );
}
