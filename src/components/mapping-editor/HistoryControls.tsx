"use client";

type HistoryControlsProps = {
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
};

export function HistoryControls({
  canUndo,
  canRedo,
  onUndo,
  onRedo,
}: HistoryControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={!canUndo}
        onClick={onUndo}
        className="rounded-md border border-[var(--mp-line)] px-2 py-1 text-xs disabled:opacity-40"
      >
        Undo
      </button>
      <button
        type="button"
        disabled={!canRedo}
        onClick={onRedo}
        className="rounded-md border border-[var(--mp-line)] px-2 py-1 text-xs disabled:opacity-40"
      >
        Redo
      </button>
    </div>
  );
}
