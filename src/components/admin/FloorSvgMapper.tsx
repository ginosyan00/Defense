"use client";

import { useState, useTransition } from "react";
import { saveApartmentSvgElementId } from "@/lib/admin/mapping-actions";

type ApartmentSvgRow = {
  id: string;
  apartmentNumber: string;
  svgElementId: string;
  status: string;
};

type FloorSvgMapperProps = {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorNumber: number;
  detectedIds: string[];
  initialApartments: ApartmentSvgRow[];
};

export function FloorSvgMapper({
  projectSlug,
  districtSlug,
  buildingSlug,
  floorNumber,
  detectedIds,
  initialApartments,
}: FloorSvgMapperProps) {
  const [rows, setRows] = useState(initialApartments);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = (apartmentId: string) => {
    const row = rows.find((item) => item.id === apartmentId);
    if (!row) return;
    setPendingId(apartmentId);
    startTransition(async () => {
      const result = await saveApartmentSvgElementId({
        apartmentId,
        svgElementId: row.svgElementId,
        projectSlug,
        districtSlug,
        buildingSlug,
        floorNumber,
      });
      setMessage(
        result.ok
          ? `Պահպանված է · ${row.apartmentNumber}`
          : result.error,
      );
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="border border-[var(--mp-line)] p-3 text-sm">
        <p className="mb-2 text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
          Detected SVG element IDs
        </p>
        {detectedIds.length === 0 ? (
          <p className="text-[var(--mp-ink-muted)]">
            ID-ներ չեն գտնվել։ Օգտագործիր typical layout ID-ներ կամ մուտքագրիր
            ձեռքով։
          </p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {detectedIds.map((id) => (
              <li
                key={id}
                className="border border-[var(--mp-line)] px-2 py-1 text-xs"
              >
                {id}
              </li>
            ))}
          </ul>
        )}
      </div>

      <table className="w-full border border-[var(--mp-line)] text-sm">
        <thead className="bg-[var(--mp-panel-hover)] text-left text-xs uppercase tracking-[0.12em] text-[var(--mp-ink-muted)]">
          <tr>
            <th className="px-3 py-2">Apartment</th>
            <th className="px-3 py-2">Status</th>
            <th className="px-3 py-2">svgElementId</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-t border-[var(--mp-line)]">
              <td className="px-3 py-2">{row.apartmentNumber}</td>
              <td className="px-3 py-2">{row.status}</td>
              <td className="px-3 py-2">
                <input
                  list="detected-svg-ids"
                  className="w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                  value={row.svgElementId}
                  onChange={(event) =>
                    setRows((prev) =>
                      prev.map((item) =>
                        item.id === row.id
                          ? { ...item, svgElementId: event.target.value }
                          : item,
                      ),
                    )
                  }
                />
              </td>
              <td className="px-3 py-2 text-right">
                <button
                  type="button"
                  className="border border-[var(--mp-ink)] px-3 py-1 text-xs uppercase tracking-[0.12em] disabled:opacity-50"
                  disabled={pending && pendingId === row.id}
                  onClick={() => onSave(row.id)}
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <datalist id="detected-svg-ids">
        {detectedIds.map((id) => (
          <option key={id} value={id} />
        ))}
      </datalist>
      {message ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
