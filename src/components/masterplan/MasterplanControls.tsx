"use client";

type MasterplanControlsProps = {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
};

export function MasterplanControls({
  onZoomIn,
  onZoomOut,
  onReset,
}: MasterplanControlsProps) {
  const buttonClass =
    "flex h-10 w-10 items-center justify-center border border-[var(--mp-line)] bg-[var(--mp-panel)] text-[var(--mp-ink)] shadow-sm transition hover:bg-[var(--mp-panel-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--mp-focus)]";

  return (
    <div
      className="absolute bottom-[max(1rem,env(safe-area-inset-bottom))] right-[max(1rem,env(safe-area-inset-right))] z-30 flex flex-col gap-2"
      role="toolbar"
      aria-label="Masterplan zoom controls"
    >
      <button type="button" className={buttonClass} onClick={onZoomIn} aria-label="Zoom in">
        +
      </button>
      <button type="button" className={buttonClass} onClick={onZoomOut} aria-label="Zoom out">
        −
      </button>
      <button type="button" className={buttonClass} onClick={onReset} aria-label="Reset view">
        ↺
      </button>
    </div>
  );
}
