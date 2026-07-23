"use client";

import { useEffect, useRef } from "react";
import { OrbitControls } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import type { OrbitControls as OrbitControlsImpl } from "three-stdlib";

type CameraControllerProps = {
  resetToken: number;
  reducedMotion: boolean;
};

const DEFAULT_POSITION: [number, number, number] = [7.5, 5.5, 7.5];

export function CameraController({
  resetToken,
  reducedMotion,
}: CameraControllerProps) {
  const controlsRef = useRef<OrbitControlsImpl>(null);
  const { camera } = useThree();

  useEffect(() => {
    camera.position.set(...DEFAULT_POSITION);
    controlsRef.current?.target.set(0, 1.6, 0);
    controlsRef.current?.update();
  }, [camera, resetToken]);

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enablePan={false}
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      minDistance={5}
      maxDistance={16}
      minPolarAngle={Math.PI * 0.18}
      maxPolarAngle={Math.PI * 0.48}
      minAzimuthAngle={-Math.PI * 0.75}
      maxAzimuthAngle={Math.PI * 0.75}
      target={[0, 1.6, 0]}
    />
  );
}
