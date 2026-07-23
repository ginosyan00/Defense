"use client";

import type { EditorTool } from "@/lib/mapping/types";

type DrawingToolbarProps = {
  tool: EditorTool;
  onToolChange: (tool: EditorTool) => void;
  canDelete: boolean;
  onDelete: () => void;
  draftHint: string | null;
};

export function DrawingToolbar({
  tool,
  onToolChange,
  canDelete,
  onDelete,
  draftHint,
}: DrawingToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-[var(--mp-line)] bg-[var(--mp-surface)] px-3 py-2">
      {(
        [
          ["select", "Select"],
          ["draw-polygon", "Draw polygon"],
          ["pan", "Pan"],
        ] as const
      ).map(([id, label]) => (
        <button
          key={id}
          type="button"
          onClick={() => onToolChange(id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium ${
            tool === id
              ? "bg-[var(--mp-ink)] text-[var(--mp-canvas)]"
              : "border border-[var(--mp-line)] text-[var(--mp-ink-muted)]"
          }`}
        >
          {label}
        </button>
      ))}
      <button
        type="button"
        disabled={!canDelete}
        onClick={onDelete}
        className="rounded-md border border-[var(--mp-line)] px-3 py-1.5 text-xs disabled:opacity-40"
      >
        Delete
      </button>
      {draftHint ? (
        <span className="ml-auto text-xs text-[var(--mp-ink-muted)]">{draftHint}</span>
      ) : null}
    </div>
  );
}
