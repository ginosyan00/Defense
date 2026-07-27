"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MappingCanvas,
  type MappingBulkPathUpdate,
  type MappingCanvasHandle,
  type MappingEntity,
} from "@/components/admin/MappingCanvas";
import { saveFloorImageMapping } from "@/lib/admin/mapping-actions";
import {
  estimatePathHeight,
  offsetNormalizedPath,
  pathCentroid,
  svgPathToNormalizedPoints,
} from "@/lib/admin/mapping-math";

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
  const floorsRef = useRef(initialFloors);
  const [floors, setFloors] = useState(initialFloors);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialFloors[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  floorsRef.current = floors;

  const sortedFloors = useMemo(
    () => [...floors].sort((a, b) => a.floorNumber - b.floorNumber),
    [floors],
  );

  const selected = useMemo(
    () => floors.find((item) => item.id === selectedId) ?? null,
    [floors, selectedId],
  );

  const persistFloor = useCallback(
    async (item: FloorEditorItem, note: string, refresh = true) => {
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
      if (!result.ok) {
        setMessage(result.error);
        return false;
      }
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(item.id);
        return next;
      });
      if (note) setMessage(note);
      if (refresh) router.refresh();
      return true;
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
      setPending(true);
      void persistFloor(
        toSave,
        "✓ Հարկի գծագիրը պահպանված է (refresh-ից հետո կմնա)",
      ).finally(() => setPending(false));
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
      setPending(true);
      void persistFloor(toSave, "Հարկի գծագիրը ջնջված է").finally(() =>
        setPending(false),
      );
    }
  };

  const onBulkPaths = useCallback(
    (updates: MappingBulkPathUpdate[]) => {
      const byId = new Map(updates.map((item) => [item.id, item]));
      const nextFloors = floorsRef.current.map((item) => {
        const update = byId.get(item.id);
        if (!update) return item;
        return {
          ...item,
          svgPath: update.svgPath,
          markerX: update.markerX,
          markerY: update.markerY,
          interactionType: "MARKER_AND_POLYGON" as const,
        };
      });
      floorsRef.current = nextFloors;
      setFloors(nextFloors);
      setDirtyIds(new Set());

      setPending(true);
      setMessage("Ավտո հարկերը պահպանվում են…");
      void (async () => {
        try {
          for (const item of nextFloors) {
            if (!byId.has(item.id)) continue;
            const ok = await persistFloor(item, "", false);
            if (!ok) return;
          }
          setMessage(`✓ ${updates.length} հարկ պահպանված է`);
          router.refresh();
        } finally {
          setPending(false);
        }
      })();
    },
    [persistFloor, router],
  );

  const copyToNeighbor = async (direction: "up" | "down") => {
    if (!selected?.svgPath) {
      setMessage("Նախ գծիր/պահպանիր ընտրված հարկի polygon-ը։");
      return;
    }
    const sorted = [...floors].sort(
      (a, b) => a.floorNumber - b.floorNumber,
    );
    const index = sorted.findIndex((item) => item.id === selected.id);
    if (index < 0) return;
    const target =
      direction === "up" ? sorted[index + 1] : sorted[index - 1];
    if (!target) {
      setMessage(
        direction === "up"
          ? "Ավելի բարձր հարկ չկա։"
          : "Ավելի ցածր հարկ չկա։",
      );
      return;
    }

    const points = svgPathToNormalizedPoints(
      selected.svgPath,
      viewBoxWidth,
      viewBoxHeight,
    );
    const height = estimatePathHeight(points);
    const dy = direction === "up" ? -height : height;
    const svgPath = offsetNormalizedPath(
      selected.svgPath,
      0,
      dy,
      viewBoxWidth,
      viewBoxHeight,
    );
    const centroid = pathCentroid(
      svgPathToNormalizedPoints(svgPath, viewBoxWidth, viewBoxHeight),
    );
    const next: FloorEditorItem = {
      ...target,
      svgPath,
      markerX: centroid.x,
      markerY: centroid.y,
      interactionType: "MARKER_AND_POLYGON",
    };

    setFloors((prev) =>
      prev.map((item) => (item.id === target.id ? next : item)),
    );
    setSelectedId(target.id);
    setPending(true);
    await persistFloor(
      next,
      direction === "up"
        ? `✓ Պատճենված է վեր · Հարկ ${target.floorNumber}`
        : `✓ Պատճենված է ներքև · Հարկ ${target.floorNumber}`,
    ).finally(() => setPending(false));
  };

  const onSave = async () => {
    if (!selected) return;
    if (canvasRef.current?.hasOpenDraft()) {
      const flushed = canvasRef.current.flushPolygonDraft();
      if (flushed) return;
      setMessage("Draft չկա պահպանելու։ Նախ գծիր առնվազն 1 կետ։");
      return;
    }
    setPending(true);
    await persistFloor(selected, "✓ Պահպանված է").finally(() =>
      setPending(false),
    );
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
              <>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    className="border border-[var(--mp-line)] px-2 py-2 text-[10px] uppercase tracking-[0.12em] disabled:opacity-50"
                    onClick={() => void copyToNeighbor("up")}
                    disabled={pending}
                    title="Պատճենել ավելի բարձր հարկ"
                  >
                    Պատճենել վեր
                  </button>
                  <button
                    type="button"
                    className="border border-[var(--mp-line)] px-2 py-2 text-[10px] uppercase tracking-[0.12em] disabled:opacity-50"
                    onClick={() => void copyToNeighbor("down")}
                    disabled={pending}
                    title="Պատճենել ավելի ցածր հարկ"
                  >
                    Պատճենել ներքև
                  </button>
                </div>
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
              </>
            ) : null}
            {message ? (
              <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
            ) : null}
          </div>
        ) : null}
      </aside>

      <MappingCanvas
        ref={canvasRef}
        toolPreset="floors"
        imageUrl={imageUrl}
        imageWidth={imageWidth}
        imageHeight={imageHeight}
        viewBoxWidth={viewBoxWidth}
        viewBoxHeight={viewBoxHeight}
        entities={sortedFloors}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChangeEntity={onChangeEntity}
        onPolygonClosed={onPolygonClosed}
        onPolygonDeleted={onPolygonDeleted}
        onBulkPaths={onBulkPaths}
      />
    </div>
  );
}
