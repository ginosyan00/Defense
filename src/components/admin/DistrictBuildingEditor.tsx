"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
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
  const canvasRef = useRef<MappingCanvasHandle>(null);
  const [buildings, setBuildings] = useState(initialBuildings);
  const buildingsRef = useRef(buildings);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialBuildings[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  useEffect(() => {
    buildingsRef.current = buildings;
  }, [buildings]);

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
          setBuildings((prev) =>
            prev.map((row) => (row.id === item.id ? item : row)),
          );
          buildingsRef.current = buildingsRef.current.map((row) =>
            row.id === item.id ? item : row,
          );
          setDirtyIds((prev) => {
            const next = new Set(prev);
            next.delete(item.id);
            return next;
          });
          setMessage(
            item.svgPath
              ? note
              : "✓ Մարկերը պահպանված է (գծագիր չկա — Polygon-ով գծիր ու ✓ սեղմիր)",
          );
        } else {
          setMessage(result.error);
        }
      } finally {
        setPending(false);
      }
    },
    [districtSlug, projectSlug],
  );

  const onChangeEntity = (
    id: string,
    patch: Partial<Pick<MappingEntity, "markerX" | "markerY" | "svgPath">>,
  ) => {
    setBuildings((prev) => {
      const next = prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, ...patch };
        if (patch.svgPath && item.interactionType === "MARKER") {
          updated.interactionType = "MARKER_AND_POLYGON";
        }
        return updated;
      });
      buildingsRef.current = next;
      return next;
    });
    setDirtyIds((prev) => new Set(prev).add(id));
  };

  const onPolygonClosed = (id: string, svgPath: string) => {
    const current = buildingsRef.current.find((item) => item.id === id);
    if (!current) {
      setMessage("Շենքը չի գտնվել — գծագիրը չպահպանվեց");
      return;
    }
    const next: BuildingEditorItem = {
      ...current,
      svgPath,
      interactionType:
        current.interactionType === "MARKER" ||
        current.interactionType === "POLYGON"
          ? "MARKER_AND_POLYGON"
          : current.interactionType,
    };
    setBuildings((prev) => prev.map((item) => (item.id === id ? next : item)));
    buildingsRef.current = buildingsRef.current.map((item) =>
      item.id === id ? next : item,
    );
    void persistBuilding(
      next,
      `✓ Գծագիրը պահպանված է DB-ում (${svgPath.length} նիշ)`,
    );
  };

  const onPolygonDeleted = (id: string) => {
    const current = buildingsRef.current.find((item) => item.id === id);
    if (!current) return;
    const next: BuildingEditorItem = {
      ...current,
      svgPath: null,
      interactionType:
        current.interactionType === "POLYGON"
          ? "MARKER"
          : current.interactionType,
    };
    setBuildings((prev) => prev.map((item) => (item.id === id ? next : item)));
    buildingsRef.current = buildingsRef.current.map((item) =>
      item.id === id ? next : item,
    );
    void persistBuilding(next, "Գծագիրը ջնջված է");
  };

  const onSave = async () => {
    if (!selected) return;

    const draftCount = canvasRef.current?.getDraftPointCount() ?? 0;
    if (draftCount > 0) {
      const savedPath = canvasRef.current?.flushPolygonDraft() ?? null;
      if (!savedPath) {
        setMessage(
          "Գծագիրը չպահպանվեց։ Polygon mode-ում գծիր կետեր, հետո սեղմիր ✓ կամ Պահպանել։",
        );
        return;
      }
      // flush → onPolygonClosed → persistBuilding
      return;
    }

    const latest =
      buildingsRef.current.find((item) => item.id === selected.id) ?? selected;
    await persistBuilding(latest, "✓ Պահպանված է");
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
