"use client";

import type { EditorRegion } from "@/lib/mapping/types";

type MappingFormProps = {
  region: EditorRegion | null;
  onChange: (patch: Partial<EditorRegion>) => void;
};

export function MappingForm({ region, onChange }: MappingFormProps) {
  if (!region) {
    return (
      <aside className="flex w-64 shrink-0 flex-col border-l border-[var(--mp-line)] bg-[var(--mp-surface)] p-3 text-xs text-[var(--mp-ink-muted)]">
        Select or draw a region to edit mapping.
      </aside>
    );
  }

  return (
    <aside className="flex w-64 shrink-0 flex-col gap-3 border-l border-[var(--mp-line)] bg-[var(--mp-surface)] p-3">
      <h2 className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--mp-ink-muted)]">
        Mapping
      </h2>
      <label className="grid gap-1 text-xs">
        Title
        <input
          className="rounded-md border border-[var(--mp-line)] bg-transparent px-2 py-1.5"
          value={region.title}
          onChange={(event) => onChange({ title: event.target.value })}
        />
      </label>
      <label className="grid gap-1 text-xs">
        Label
        <input
          className="rounded-md border border-[var(--mp-line)] bg-transparent px-2 py-1.5"
          value={region.label ?? ""}
          onChange={(event) => onChange({ label: event.target.value || null })}
        />
      </label>
      <label className="grid gap-1 text-xs">
        Destination type
        <select
          className="rounded-md border border-[var(--mp-line)] bg-transparent px-2 py-1.5"
          value={region.destinationType}
          onChange={(event) =>
            onChange({ destinationType: event.target.value })
          }
        >
          <option value="INFORMATION_ONLY">INFORMATION_ONLY</option>
          <option value="DISTRICT">DISTRICT</option>
          <option value="BUILDING">BUILDING</option>
          <option value="FLOOR">FLOOR</option>
          <option value="APARTMENT">APARTMENT</option>
          <option value="EXTERNAL_URL">EXTERNAL_URL</option>
          <option value="DISABLED">DISABLED</option>
        </select>
      </label>
      <label className="grid gap-1 text-xs">
        Custom URL
        <input
          className="rounded-md border border-[var(--mp-line)] bg-transparent px-2 py-1.5"
          value={region.customUrl ?? ""}
          onChange={(event) =>
            onChange({ customUrl: event.target.value || null })
          }
          placeholder="https://…"
        />
      </label>
      <label className="grid gap-1 text-xs">
        Status
        <select
          className="rounded-md border border-[var(--mp-line)] bg-transparent px-2 py-1.5"
          value={region.status}
          onChange={(event) =>
            onChange({
              status: event.target.value as EditorRegion["status"],
            })
          }
        >
          <option value="DRAFT">DRAFT</option>
          <option value="PUBLISHED">PUBLISHED</option>
        </select>
      </label>
      <p className="text-[11px] leading-relaxed text-[var(--mp-ink-muted)]">
        Points are normalized 0–1. Zoom/pan never mutates stored geometry.
      </p>
    </aside>
  );
}
