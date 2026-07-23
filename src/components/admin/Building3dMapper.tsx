"use client";

import { useState, useTransition } from "react";
import { saveFloorMeshName } from "@/lib/admin/mapping-actions";

type FloorMeshRow = {
  id: string;
  floorNumber: number;
  name: string;
  meshName: string;
};

type Building3dMapperProps = {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  model3dUrl: string | null;
  discoveredMeshes: string[];
  initialFloors: FloorMeshRow[];
};

export function Building3dMapper({
  projectSlug,
  districtSlug,
  buildingSlug,
  model3dUrl,
  discoveredMeshes,
  initialFloors,
}: Building3dMapperProps) {
  const [floors, setFloors] = useState(initialFloors);
  const [message, setMessage] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSave = (floorId: string) => {
    const row = floors.find((item) => item.id === floorId);
    if (!row) return;
    setPendingId(floorId);
    startTransition(async () => {
      const result = await saveFloorMeshName({
        floorId,
        meshName: row.meshName,
        projectSlug,
        districtSlug,
        buildingSlug,
      });
      setMessage(
        result.ok ? `Պահպանված է · ${row.name}` : result.error,
      );
      setPendingId(null);
    });
  };

  return (
    <div className="space-y-4">
      <div className="border border-[var(--mp-line)] p-4 text-sm">
        <p className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
          GLB model
        </p>
        <p className="mt-1">{model3dUrl ?? "Model URL դեռ չկա (Phase 6 loader)"}</p>
        <p className="mt-3 text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
          Discovered mesh names
        </p>
        {discoveredMeshes.length === 0 ? (
          <p className="mt-1 text-[var(--mp-ink-muted)]">
            Mesh parsing-ը կաշխատի GLB upload/load-ից հետո։ Հիմա կարող ես ձեռքով
            կապել `Floor.meshName`-ը։
          </p>
        ) : (
          <ul className="mt-2 flex flex-wrap gap-2">
            {discoveredMeshes.map((name) => (
              <li
                key={name}
                className="border border-[var(--mp-line)] px-2 py-1 text-xs"
              >
                {name}
              </li>
            ))}
          </ul>
        )}
      </div>

      <table className="w-full border border-[var(--mp-line)] text-sm">
        <thead className="bg-[var(--mp-panel-hover)] text-left text-xs uppercase tracking-[0.12em] text-[var(--mp-ink-muted)]">
          <tr>
            <th className="px-3 py-2">Floor</th>
            <th className="px-3 py-2">meshName</th>
            <th className="px-3 py-2" />
          </tr>
        </thead>
        <tbody>
          {floors.map((floor) => (
            <tr key={floor.id} className="border-t border-[var(--mp-line)]">
              <td className="px-3 py-2">
                {floor.name} (#{floor.floorNumber})
              </td>
              <td className="px-3 py-2">
                <input
                  list="discovered-meshes"
                  className="w-full border border-[var(--mp-line)] bg-transparent px-2 py-1"
                  value={floor.meshName}
                  onChange={(event) =>
                    setFloors((prev) =>
                      prev.map((item) =>
                        item.id === floor.id
                          ? { ...item, meshName: event.target.value }
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
                  disabled={pending && pendingId === floor.id}
                  onClick={() => onSave(floor.id)}
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <datalist id="discovered-meshes">
        {discoveredMeshes.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {message ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
