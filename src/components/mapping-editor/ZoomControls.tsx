"use client";

type ZoomControlsProps = {
  scale: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export function ZoomControls({
  scale,
  onZoomIn,
  onZoomOut,
  onReset,
}: ZoomControlsProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={onZoomOut}
        className="rounded-md border border-[var(--mp-line)] px-2 py-1 text-xs"
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="min-w-[3.5rem] text-center text-xs tabular-nums text-[var(--mp-ink-muted)]">
        {Math.round(scale * 100)}%
      </span>
      <button
        type="button"
        onClick={onZoomIn}
        className="rounded-md border border-[var(--mp-line)] px-2 py-1 text-xs"
        aria-label="Zoom in"
      >
        +
      </button>
      <button
        type="button"
        onClick={onReset}
        className="rounded-md border border-[var(--mp-line)] px-2 py-1 text-xs"
      >
        Reset
      </button>
    </div>
  );
}
