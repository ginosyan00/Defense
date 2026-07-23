"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MappingCanvas,
  type MappingCanvasHandle,
  type MappingEntity,
} from "@/components/admin/MappingCanvas";
import { saveFloorImageMapping } from "@/lib/admin/mapping-actions";

type FloorEditorItem = MappingEntity & {
  interactionType: "MARKER" | "POLYGON" | "MARKER_AND_POLYGON";
  floorNumber: number;
};

type BuildingFloorMappingEditorProps = {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  initialFloors: FloorEditorItem[];
};

export function BuildingFloorMappingEditor({
  projectSlug,
  districtSlug,
  buildingSlug,
  imageUrl,
  imageWidth,
  imageHeight,
  viewBoxWidth,
  viewBoxHeight,
  initialFloors,
}: BuildingFloorMappingEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<MappingCanvasHandle>(null);
  const [floors, setFloors] = useState(initialFloors);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFloors[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => floors.find((item) => item.id === selectedId) ?? null,
    [floors, selectedId],
  );

  const persistFloor = useCallback(
    async (item: FloorEditorItem, note: string) => {
      setPending(true);
      setMessage("Պահպանվում է…");
      try {
        const result = await saveFloorImageMapping({
          floorId: item.id,
          markerX: item.markerX,
          markerY: item.markerY,
          markerLabel: item.label,
          svgPath: item.svgPath,
          interactionType: item.interactionType,
          projectSlug,
          districtSlug,
          buildingSlug,
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
    [buildingSlug, districtSlug, projectSlug, router],
  );

  const onChangeEntity = (
    id: string,
    patch: Partial<Pick<MappingEntity, "markerX" | "markerY" | "svgPath">>,
  ) => {
    setFloors((prev) =>
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
    let toSave: FloorEditorItem | null = null;
    setFloors((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: FloorEditorItem = {
        ...current,
        svgPath,
        interactionType:
          current.interactionType === "MARKER" ||
          current.interactionType === "POLYGON"
            ? "MARKER_AND_POLYGON"
            : current.interactionType,
      };
      toSave = next;
      return prev.map((item) => (item.id === id ? next : item));
    });
    if (toSave) {
      void persistFloor(
        toSave,
        "✓ Հարկի գծագիրը պահպանված է (refresh-ից հետո կմնա)",
      );
    }
  };

  const onPolygonDeleted = (id: string) => {
    let toSave: FloorEditorItem | null = null;
    setFloors((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: FloorEditorItem = {
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
      void persistFloor(toSave, "Հարկի գծագիրը ջնջված է");
    }
  };

  const onSave = async () => {
    if (!selected) return;
    if (canvasRef.current?.hasOpenDraft()) {
      const flushed = canvasRef.current.flushPolygonDraft();
      if (flushed) return;
      setMessage("Draft-ը ≥3 կետ չունի։");
      return;
    }
    await persistFloor(selected, "✓ Պահպանված է");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Floors
        </h2>
        <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
          {floors.map((floor) => (
            <li key={floor.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  floor.id === selectedId ? "bg-[var(--mp-panel-hover)]" : ""
                }`}
                onClick={() => setSelectedId(floor.id)}
              >
                <span>
                  {floor.label} · {floor.title}
                  {dirtyIds.has(floor.id) ? " · *" : ""}
                  {floor.svgPath ? " · mapped" : " · no polygon"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-2 border border-[var(--mp-line)] p-3 text-sm">
            <p className="text-xs text-[var(--mp-ink-muted)]">
              Floor {selected.floorNumber}
            </p>
            <label className="block">
              Label
              <input
                className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                value={selected.label}
                onChange={(event) =>
                  setFloors((prev) =>
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
                  setFloors((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? {
                            ...item,
                            interactionType: event.target
                              .value as FloorEditorItem["interactionType"],
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
                  if (!window.confirm("Ջնջե՞լ այս հարկի գծագիրը։")) return;
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
        entities={floors}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChangeEntity={onChangeEntity}
        onPolygonClosed={onPolygonClosed}
        onPolygonDeleted={onPolygonDeleted}
      />
    </div>
  );
}
