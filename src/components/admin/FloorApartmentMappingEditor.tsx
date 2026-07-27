"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  MappingCanvas,
  type MappingCanvasHandle,
  type MappingEntity,
} from "@/components/admin/MappingCanvas";
import { saveApartmentImageMapping } from "@/lib/admin/mapping-actions";

type ApartmentEditorItem = MappingEntity & {
  interactionType: "MARKER" | "POLYGON" | "MARKER_AND_POLYGON";
  apartmentNumber: string;
  status: string;
  rooms: number;
  totalArea: number;
  price: number;
  currency: string;
};

type FloorApartmentMappingEditorProps = {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorNumber: number;
  imageUrl: string;
  imageWidth: number;
  imageHeight: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  initialApartments: ApartmentEditorItem[];
};

export function FloorApartmentMappingEditor({
  projectSlug,
  districtSlug,
  buildingSlug,
  floorNumber,
  imageUrl,
  imageWidth,
  imageHeight,
  viewBoxWidth,
  viewBoxHeight,
  initialApartments,
}: FloorApartmentMappingEditorProps) {
  const router = useRouter();
  const canvasRef = useRef<MappingCanvasHandle>(null);
  const [apartments, setApartments] = useState(initialApartments);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialApartments[0]?.id ?? null,
  );
  const [message, setMessage] = useState<string | null>(null);
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(new Set());
  const [pending, setPending] = useState(false);

  const selected = useMemo(
    () => apartments.find((item) => item.id === selectedId) ?? null,
    [apartments, selectedId],
  );

  const persistApartment = useCallback(
    async (item: ApartmentEditorItem, note: string) => {
      setPending(true);
      setMessage("Պահպանվում է…");
      try {
        const result = await saveApartmentImageMapping({
          apartmentId: item.id,
          markerX: item.markerX,
          markerY: item.markerY,
          markerLabel: item.label,
          svgPath: item.svgPath,
          interactionType: item.interactionType,
          projectSlug,
          districtSlug,
          buildingSlug,
          floorNumber,
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
    [buildingSlug, districtSlug, floorNumber, projectSlug, router],
  );

  const onChangeEntity = (
    id: string,
    patch: Partial<Pick<MappingEntity, "markerX" | "markerY" | "svgPath">>,
  ) => {
    setApartments((prev) =>
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
    let toSave: ApartmentEditorItem | undefined;
    setApartments((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: ApartmentEditorItem = {
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
      void persistApartment(
        toSave,
        `✓ Բնակարան ${toSave.apartmentNumber}-ը կապված է գծագրին`,
      );
    }
  };

  const onPolygonDeleted = (id: string) => {
    let toSave: ApartmentEditorItem | null = null;
    setApartments((prev) => {
      const current = prev.find((item) => item.id === id);
      if (!current) return prev;
      const next: ApartmentEditorItem = {
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
      void persistApartment(toSave, "Գծագիրը ջնջված է");
    }
  };

  const onSave = async () => {
    if (!selected) return;
    if (canvasRef.current?.hasOpenDraft()) {
      const flushed = canvasRef.current.flushPolygonDraft();
      if (flushed) return;
      setMessage("Draft չկա պահպանելու։ Նախ գծիր առնվազն 1 կետ։");
      return;
    }
    await persistApartment(selected, "✓ Պահպանված է");
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_1fr]">
      <aside className="space-y-3">
        <h2 className="font-[family-name:var(--font-display)] text-xl">
          Բնակարաններ
        </h2>
        <ul className="divide-y divide-[var(--mp-line)] border border-[var(--mp-line)]">
          {apartments.map((apartment) => (
            <li key={apartment.id}>
              <button
                type="button"
                className={`flex w-full flex-col px-3 py-2 text-left text-sm ${
                  apartment.id === selectedId ? "bg-[var(--mp-panel-hover)]" : ""
                }`}
                onClick={() => {
                  if (
                    apartment.id !== selectedId &&
                    canvasRef.current?.hasOpenDraft()
                  ) {
                    const flushed = canvasRef.current.flushPolygonDraft();
                    if (!flushed) {
                      setMessage(
                        "Draft չկա պահպանելու։ Նախ գծիր առնվազն 1 կետ կամ Չեղարկիր։",
                      );
                      return;
                    }
                  }
                  setSelectedId(apartment.id);
                }}
              >
                <span>
                  {apartment.apartmentNumber} · {apartment.status}
                  {dirtyIds.has(apartment.id) ? " · *" : ""}
                </span>
                <span className="text-[11px] text-[var(--mp-ink-muted)]">
                  {apartment.rooms} սենյակ · {apartment.totalArea} մ² ·{" "}
                  {apartment.svgPath ? "mapped" : "no polygon"}
                </span>
              </button>
            </li>
          ))}
        </ul>

        {selected ? (
          <div className="space-y-2 border border-[var(--mp-line)] p-3 text-sm">
            <p className="text-xs text-[var(--mp-ink-muted)]">
              Source of truth՝ apartment entity ({selected.price}{" "}
              {selected.currency})
            </p>
            <label className="block">
              Label
              <input
                className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                value={selected.label}
                onChange={(event) =>
                  setApartments((prev) =>
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
                  setApartments((prev) =>
                    prev.map((item) =>
                      item.id === selected.id
                        ? {
                            ...item,
                            interactionType: event.target
                              .value as ApartmentEditorItem["interactionType"],
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
                  if (!window.confirm("Ջնջե՞լ այս բնակարանի գծագիրը։")) return;
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
        entities={apartments}
        selectedId={selectedId}
        onSelect={setSelectedId}
        onChangeEntity={onChangeEntity}
        onPolygonClosed={onPolygonClosed}
        onPolygonDeleted={onPolygonDeleted}
      />
    </div>
  );
}
