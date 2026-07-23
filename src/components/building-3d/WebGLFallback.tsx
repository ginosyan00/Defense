"use client";

import { useState } from "react";

type WebGLFallbackProps = {
  previewImageUrl?: string | null;
  message?: string;
};

export function WebGLFallback({
  previewImageUrl,
  message = "WebGL հասանելի չէ այս սարքում։ Օգտագործեք հարկերի ցանկը։",
}: WebGLFallbackProps) {
  const [previewFailed, setPreviewFailed] = useState(false);

  return (
    <div className="flex h-full min-h-[360px] flex-col items-center justify-center gap-4 bg-[var(--mp-fallback)] p-6 text-center text-[var(--mp-panel)]">
      {previewImageUrl && !previewFailed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={previewImageUrl}
          alt="Building preview"
          className="max-h-48 max-w-full object-contain opacity-80"
          onError={() => setPreviewFailed(true)}
        />
      ) : null}
      <p className="max-w-md text-sm tracking-wide">{message}</p>
    </div>
  );
}
