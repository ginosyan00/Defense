"use client";

import { useState } from "react";

type MasterplanImageProps = {
  src: string;
  alt: string;
  width: number;
  height: number;
  className?: string;
};

export function MasterplanImage({
  src,
  alt,
  width,
  height,
  className,
}: MasterplanImageProps) {
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [retryToken, setRetryToken] = useState(0);

  if (status === "error") {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--mp-fallback)] text-[var(--mp-ink-muted)]"
        role="img"
        aria-label="Masterplan image unavailable"
      >
        <p className="text-sm tracking-wide">Պատկերը չհաջողվեց բեռնել</p>
        <button
          type="button"
          className="rounded border border-[var(--mp-line)] px-3 py-1.5 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)]"
          onClick={() => {
            setStatus("loading");
            setRetryToken((value) => value + 1);
          }}
        >
          Կրկին փորձել
        </button>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      {status === "loading" ? (
        <div
          className="absolute inset-0 animate-pulse bg-[linear-gradient(120deg,#d7d2c8_0%,#ece8df_45%,#d7d2c8_100%)]"
          aria-hidden
        />
      ) : null}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={retryToken}
        src={src}
        alt={alt}
        width={width}
        height={height}
        draggable={false}
        fetchPriority="high"
        decoding="async"
        className={`h-full w-full select-none object-fill ${status === "ready" ? "opacity-100" : "opacity-0"} ${className ?? ""}`}
        onLoad={() => setStatus("ready")}
        onError={() => setStatus("error")}
      />
    </div>
  );
}
