"use client";

import type { EditorRegion } from "@/lib/mapping/types";

type EntitySidebarProps = {
  regions: EditorRegion[];
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function EntitySidebar({
  regions,
  selectedId,
  onSelect,
}: EntitySidebarProps) {
  return (
    <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--mp-line)] bg-[var(--mp-surface)]">
      <div className="border-b border-[var(--mp-line)] px-3 py-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mp-ink-muted)]">
        Regions
      </div>
      <ul className="flex-1 overflow-auto p-2 text-sm">
        {regions.length === 0 ? (
          <li className="px-2 py-3 text-xs text-[var(--mp-ink-muted)]">
            No regions yet. Draw a polygon.
          </li>
        ) : (
          regions.map((region) => (
            <li key={region.id}>
              <button
                type="button"
                onClick={() => onSelect(region.id)}
                className={`mb-1 w-full rounded-md px-2 py-2 text-left text-xs ${
                  selectedId === region.id
                    ? "bg-[var(--mp-ink)] text-[var(--mp-canvas)]"
                    : "hover:bg-black/5"
                }`}
              >
                <div className="font-medium">{region.title}</div>
                <div className="opacity-70">
                  {region.status} · {region.points.length} pts
                </div>
              </button>
            </li>
          ))
        )}
      </ul>
    </aside>
  );
}
