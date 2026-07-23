"use client";

type ViewerToolbarProps = {
  onReset: () => void;
  onFullscreen: () => void;
  loadingProgress: number | null;
  reducedMotion: boolean;
};

export function ViewerToolbar({
  onReset,
  onFullscreen,
  loadingProgress,
  reducedMotion,
}: ViewerToolbarProps) {
  return (
    <div className="absolute right-3 top-3 z-20 flex flex-col items-end gap-2">
      {loadingProgress != null && loadingProgress < 1 ? (
        <div className="border border-[var(--mp-line)] bg-[var(--mp-panel)] px-3 py-1.5 text-xs text-[var(--mp-ink)]">
          Բեռնում… {Math.round(loadingProgress * 100)}%
        </div>
      ) : null}
      <div
        className="flex gap-2"
        role="toolbar"
        aria-label="3D viewer controls"
      >
        <button
          type="button"
          className="border border-[var(--mp-line)] bg-[var(--mp-panel)] px-3 py-2 text-xs uppercase tracking-[0.14em]"
          onClick={onReset}
        >
          Reset
        </button>
        <button
          type="button"
          className="border border-[var(--mp-line)] bg-[var(--mp-panel)] px-3 py-2 text-xs uppercase tracking-[0.14em]"
          onClick={onFullscreen}
        >
          Fullscreen
        </button>
      </div>
      {reducedMotion ? (
        <p className="text-[10px] uppercase tracking-[0.12em] text-[var(--mp-panel)]">
          Reduced motion
        </p>
      ) : null}
    </div>
  );
}
