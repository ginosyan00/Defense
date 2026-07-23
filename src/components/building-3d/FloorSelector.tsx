"use client";

import type { BuildingFloor3D } from "@/types/building-3d";

type FloorSelectorProps = {
  floors: BuildingFloor3D[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  onConfirm: (href: string) => void;
};

export function FloorSelector({
  floors,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  onConfirm,
}: FloorSelectorProps) {
  const selected = floors.find((floor) => floor.id === selectedId) ?? null;

  return (
    <div className="flex h-full flex-col border border-[var(--mp-line)] bg-[var(--mp-panel)]">
      <div className="border-b border-[var(--mp-line)] px-4 py-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">Հարկեր</h2>
        <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
          3D-ից բացի պարտադիր ցանկ։ Hover/click-ը համաժամեցված է model-ի հետ։
        </p>
      </div>
      <ul className="flex-1 overflow-auto">
        {floors.map((floor) => {
          const active = floor.id === hoveredId || floor.id === selectedId;
          return (
            <li key={floor.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-4 py-3 text-left text-sm transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--mp-focus)] ${
                  active ? "bg-[var(--mp-panel-hover)]" : ""
                }`}
                onMouseEnter={() => onHover(floor.id)}
                onMouseLeave={() => onHover(null)}
                onFocus={() => onHover(floor.id)}
                onBlur={() => onHover(null)}
                onClick={() => onSelect(floor.id)}
              >
                <span>
                  <span className="block">{floor.name}</span>
                  <span className="block text-xs text-[var(--mp-ink-muted)]">
                    {floor.availableApartmentCount} հասանելի · {floor.meshName}
                  </span>
                </span>
                <span className="text-xs uppercase tracking-[0.12em] text-[var(--mp-ink-muted)]">
                  #{floor.floorNumber}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      {selected ? (
        <div className="border-t border-[var(--mp-line)] p-4">
          <p className="text-sm">
            Ընտրված՝ <strong>{selected.name}</strong>
          </p>
          <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
            {selected.availableApartmentCount}/{selected.totalApartmentCount}{" "}
            հասանելի բնակարան
          </p>
          <button
            type="button"
            className="mt-3 w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)]"
            onClick={() => onConfirm(selected.href)}
          >
            Բացել հատակագիծ
          </button>
        </div>
      ) : (
        <div className="border-t border-[var(--mp-line)] p-4 text-xs text-[var(--mp-ink-muted)]">
          Ընտրեք հարկը 3D-ում կամ ցանկից։
        </div>
      )}
    </div>
  );
}
