"use client";

import type { BuildingFloor3D } from "@/types/building-3d";

type BuildingTooltipProps = {
  floor: BuildingFloor3D | null;
  visible: boolean;
};

export function BuildingTooltip({ floor, visible }: BuildingTooltipProps) {
  if (!floor || !visible) return null;

  return (
    <div
      className="pointer-events-none absolute left-3 top-3 z-20 border border-[var(--mp-line)] bg-[var(--mp-panel)] px-3 py-2 text-sm shadow"
      role="status"
    >
      <p className="font-[family-name:var(--font-display)] text-base">
        {floor.name}
      </p>
      <p className="text-xs text-[var(--mp-ink-muted)]">
        {floor.availableApartmentCount}/{floor.totalApartmentCount} հասանելի ·
        mesh `{floor.meshName}`
      </p>
    </div>
  );
}
