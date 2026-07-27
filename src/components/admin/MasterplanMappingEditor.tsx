"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MappingCanvas,
  type MappingCanvasHandle,
  type MappingEntity,
} from "@/components/admin/MappingCanvas";
import { saveDistrictMapping } from "@/lib/admin/mapping-actions";
import { deleteDistrict } from "@/lib/admin/project-actions";

type DistrictEditorItem = MappingEntity & {
  interactionType: "MARKER" | "POLYGON" | "MARKER_AND_POLYGON";
};

type MasterplanMappingEditorProps = {
  projectSlug: string;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  initialDistricts: DistrictEditorItem[];
};

function formatMarkerPercent(value: number | null): string {
  if (value == null) return "—";
  return `${Math.round(value * 100)}%`;
}

export function MasterplanMappingEditor({
  projectSlug,
  imageUrl,
  imageWidth,
  imageHeight,
  viewBoxWidth,
  viewBoxHeight,
  initialDistricts,
}: MasterplanMappingEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<MappingCanvasHandle>(null);
  const [districts, setDistricts] = useState(initialDistricts);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialDistricts[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => districts.find((item) => item.id === selectedId) ?? null,
    [districts, selectedId],
  );

  const persistDistrict = useCallback(
    async (item: DistrictEditorItem, note: string) => {
      const label = item.label.trim();
      if (!label) {
        setMessage("Label-ը չի կարող դատարկ լինել։");
        return;
      }
      setPending(true);
      setMessage("Պահպանվում է…");
      try {
        const result = await saveDistrictMapping({
          districtId: item.id,
          markerX: item.markerX,
          markerY: item.markerY,
          markerLabel: label,
          svgPath: item.svgPath,
          interactionType: item.interactionType,
          projectSlug,
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
    [projectSlug, router],
  );

  const onChangeEntity = (
    id: string,
    patch: Partial<Pick<MappingEntity, "markerX" | "markerY" | "svgPath">>,
  ) => {
    setDistricts((prev) =>
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
    let toSave: DistrictEditorItem | null = null;
    setDistricts((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: DistrictEditorItem = {
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
      void persistDistrict(
        toSave,
        "✓ Գծագիրը պահպանված է DB-ում (refresh-ից հետո կմնա)",
      );
    }
  };

  const onPolygonDeleted = (id: string) => {
    let toSave: DistrictEditorItem | null = null;
    setDistricts((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: DistrictEditorItem = {
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
      void persistDistrict(toSave, "Գծագիրը ջնջված է");
    }
  };

  const onSave = async () => {
    if (!selected) return;
    if (canvasRef.current?.hasOpenDraft()) {
      const flushed = canvasRef.current.flushPolygonDraft();
      if (flushed) return;
      setMessage(
        "Draft չկա պահպանելու։ Նախ գծիր առնվազն 1 կետ, կամ շարունակիր Polygon mode-ում։",
      );
      return;
    }
    await persistDistrict(selected, "✓ Պահպանված է");
  };

  const onClearMarker = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        "Հանե՞լ նշիչը map-ից։ Թաղամասը կմնա ցանկում, կարող ես նորից տեղադրել Marker գործիքով։",
      )
    ) {
      return;
    }
    const next: DistrictEditorItem = {
      ...selected,
      markerX: null,
      markerY: null,
    };
    setDistricts((prev) =>
      prev.map((item) => (item.id === selected.id ? next : item)),
    );
    await persistDistrict(next, "✓ Նշիչը հանված է");
  };

  const onDeleteDistrict = async () => {
    if (!selected) return;
    if (
      !window.confirm(
        `Ջնջե՞լ «${selected.title}» թաղամասը։ Կջնջվեն նաև իր շենքերը, հարկերն ու բնակարանները։`,
      )
    ) {
      return;
    }
    setPending(true);
    setMessage("Ջնջվում է…");
    try {
      const result = await deleteDistrict({
        districtId: selected.id,
        projectSlug,
      });
      if (!result.ok) {
        setMessage(result.error);
        return;
      }
      const remaining = districts.filter((item) => item.id !== selected.id);
      setDistricts(remaining);
      setSelectedId(remaining[0]?.id ?? null);
      setDirtyIds((prev) => {
        const next = new Set(prev);
        next.delete(selected.id);
        return next;
      });
      setMessage("✓ Թաղամասը ջնջված է");
      router.refresh();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      <aside className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Districts
        </h2>
        <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
          {districts.map((district) => (
            <li key={district.id}>
              <button
                type="button"
                className={`flex w-full items-center justify-between px-3 py-2 text-left text-sm ${
                  district.id === selectedId ? "bg-[var(--mp-panel-hover)]" : ""
                }`}
                onClick={() => setSelectedId(district.id)}
              >
                <span>
                  {district.label} · {district.title}
                  {dirtyIds.has(district.id) ? " · *" : ""}
                </span>
                <span className="text-[10px] text-[var(--mp-ink-muted)]">
                  {formatMarkerPercent(district.markerX)},
                  {formatMarkerPercent(district.markerY)}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-2 border border-[var(--mp-line)] p-3 text-sm">
            <label className="block">
              Marker տառ / label
              <input
                className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                value={selected.label}
                maxLength={8}
                onChange={(event) => {
                  const label = event.target.value;
                  setDistricts((prev) =>
                    prev.map((item) =>
                      item.id === selected.id ? { ...item, label } : item,
                    ),
                  );
                  setDirtyIds((prev) => new Set(prev).add(selected.id));
                }}
              />
            </label>
            <p className="text-[11px] text-[var(--mp-ink-muted)]">
              Փոխիր տառը (օր. A → B) և սեղմիր Պահպանել։
            </p>
            <label className="block">
              Interaction
              <select
                className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                value={selected.interactionType}
                onChange={(event) => {
                  setDistricts((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? {
                            ...item,
                            interactionType: event.target
                              .value as DistrictEditorItem["interactionType"],
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
            {selected.markerX != null && selected.markerY != null ? (
              <button
                type="button"
                className="w-full border border-[var(--mp-line)] px-3 py-2 text-xs uppercase tracking-[0.14em] disabled:opacity-50"
                onClick={() => void onClearMarker()}
                disabled={pending}
              >
                Հանել նշիչը
              </button>
            ) : (
              <p className="text-[11px] text-[var(--mp-ink-muted)]">
                Նշիչ չկա · Marker գործիքով տեղադրիր map-ի վրա։
              </p>
            )}
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
            <button
              type="button"
              className="w-full border border-red-700/40 px-3 py-2 text-xs uppercase tracking-[0.14em] text-red-800 disabled:opacity-50"
              onClick={() => void onDeleteDistrict()}
              disabled={pending}
            >
              Ջնջել թաղամասը
            </button>
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
        entities={districts}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChangeEntity={onChangeEntity}
        onPolygonClosed={onPolygonClosed}
        onPolygonDeleted={onPolygonDeleted}
      />
    </div>
  );
}
