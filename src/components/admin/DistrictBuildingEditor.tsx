"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MappingCanvas,
  type MappingCanvasHandle,
  type MappingEntity,
} from "@/components/admin/MappingCanvas";
import { saveBuildingMapping } from "@/lib/admin/mapping-actions";

type BuildingEditorItem = MappingEntity & {
  interactionType: "MARKER" | "POLYGON" | "MARKER_AND_POLYGON";
};

type DistrictBuildingEditorProps = {
  projectSlug: string;
  districtSlug: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  initialBuildings: BuildingEditorItem[];
};

export function DistrictBuildingEditor({
  projectSlug,
  districtSlug,
  imageUrl,
  imageWidth,
  imageHeight,
  viewBoxWidth,
  viewBoxHeight,
  initialBuildings,
}: DistrictBuildingEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<MappingCanvasHandle>(null);
  const [buildings, setBuildings] = useState(initialBuildings);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBuildings[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => buildings.find((item) => item.id === selectedId) ?? null,
    [buildings, selectedId],
  );

  const persistBuilding = useCallback(
    async (item: BuildingEditorItem, note: string) => {
      setPending(true);
      setMessage("Պահպանվում է…");
      try {
        const result = await saveBuildingMapping({
          buildingId: item.id,
          markerX: item.markerX,
          markerY: item.markerY,
          markerLabel: item.label,
          svgPath: item.svgPath,
          interactionType: item.interactionType,
          projectSlug,
          districtSlug,
        });
        if (result.ok) {
          setDirtyIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          setMessage(note);
          router.refresh();
        } else {
          setMessage(result.error);
        }
      } finally {
        setPending(false);
      }
    },
    [districtSlug, projectSlug, router],
  );

  const onChangeEntity = (
    id: string,
    patch: Partial<Pick<MappingEntity, "markerX" | "markerY" | "svgPath">>,
  ) => {
    setBuildings((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const next = { ...item, ...patch };
        if (patch.svgPath && item.interactionType === "MARKER") {
          next.interactionType = "MARKER_AND_POLYGON";
        }
        return next;
      }),
    );
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  const onPolygonClosed = (id: string, svgPath: string) => {
    let toSave: BuildingEditorItem | null = null;
    setBuildings((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: BuildingEditorItem = {
        ...current,
        svgPath,
        interactionType:
          current.interactionType === "MARKER"
            ? "MARKER_AND_POLYGON"
            : current.interactionType === "POLYGON"
              ? "MARKER_AND_POLYGON"
              : current.interactionType,
      };
      toSave = next;
      return prev.map((item) => (item.id === id ? next : item));
    });
    if (toSave) {
      void persistBuilding(
        toSave,
        "✓ Գծագիրը պահպանված է DB-ում (refresh-ից հետո կմնա)",
      );
    }
  };

  const onPolygonDeleted = (id: string) => {
    let toSave: BuildingEditorItem | null = null;
    setBuildings((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: BuildingEditorItem = {
        ...current,
        svgPath: null,
        interactionType:
          current.interactionType === "POLYGON"
            ? "MARKER"
            : current.interactionType,
      };
      toSave = next;
      return prev.map((item) => (item.id === id ? next : item));
    });
    if (toSave) {
      void persistBuilding(toSave, "Գծագիրը ջնջված է");
    }
  };

  const onSave = async () => {
    if (!selected) return;
    if (canvasRef.current?.hasOpenDraft()) {
      const flushed = canvasRef.current.flushPolygonDraft();
      if (flushed) return;
      setMessage(
        "Draft-ը դեռ ≥3 կետ չունի։ Ավելացրու կետեր կամ Չեղարկիր draft-ը։",
      );
      return;
    }
    await persistBuilding(selected, "✓ Պահպանված է");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Buildings
        </h2>
        <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
          {buildings.map((building) => (
            <li key={building.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  building.id === selectedId ? "bg-[var(--mp-panel-hover)]" : ""
                }`}
                onClick={() => setSelectedId(building.id)}
              >
                <span>
                  {building.label} · {building.title}
                  {dirtyIds.has(building.id) ? " · *" : ""}
                  {building.svgPath ? " · mapped" : " · no polygon"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-2 border border-[var(--mp-line)] p-3 text-sm">
            <label className="block">
              Label
              <input
                className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                value={selected.label}
                onChange={(event) =>
                  setBuildings((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? { ...item, label: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </label>
            <label className="block">
              Interaction
              <select
                className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                value={selected.interactionType}
                onChange={(event) => {
                  setBuildings((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? {
                            ...item,
                            interactionType: event.target
                              .value as BuildingEditorItem["interactionType"],
                          }
                        : item,
                    ),
                  );
                  setDirtyIds((prev) => new Set(prev).add(selected.id));
                }}
              >
                <option value="MARKER">MARKER</option>
                <option value="POLYGON">POLYGON</option>
                <option value="MARKER_AND_POLYGON">MARKER_AND_POLYGON</option>
              </select>
            </label>
            <button
              type="button"
              className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-50"
              onClick={() => void onSave()}
              disabled={pending}
            >
              {pending ? "Պահպանում…" : "Պահպանել"}
            </button>
            {selected.svgPath ? (
              <button
                type="button"
                className="w-full border border-red-700/40 px-3 py-2 text-xs uppercase tracking-[0.14em] text-red-800 disabled:opacity-50"
                onClick={() => {
                  if (
                    !window.confirm(
                      "Ջնջե՞լ այս գծագիրը։ Կարող ես հետո նոր polygon գծել։",
                    )
                  ) {
                    return;
                  }
                  onPolygonDeleted(selected.id);
                }}
                disabled={pending}
              >
                Ջնջել polygon
              </button>
            ) : null}
            {message ? (
              <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
            ) : null}
          </div>
        ) : null}
      </aside>

      <MappingCanvas
        ref={canvasRef}
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        viewBoxWidth={viewBoxWidth}
        viewBoxHeight={viewBoxHeight}
        entities={buildings}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChangeEntity={onChangeEntity}
        onPolygonClosed={onPolygonClosed}
        onPolygonDeleted={onPolygonDeleted}
      />
    </div>
  );
}
