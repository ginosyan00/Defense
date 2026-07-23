"use client";

import dynamic from "next/dynamic";
import type { Building3DPayload } from "@/types/building-3d";

const Building3DViewer = dynamic(
  () =>
    import("@/components/building-3d/Building3DViewer").then(
      (mod) => mod.Building3DViewer,
    ),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-[420px] items-center justify-center border border-[var(--mp-line)] bg-[var(--mp-stage)] text-sm text-[var(--mp-panel)]">
        3D viewer-ը բեռնվում է…
      </div>
    ),
  },
);

type Building3DViewerLazyProps = {
  payload: Building3DPayload;
};

/** Server-safe island: Three.js chunk loads only on the building page client. */
export function Building3DViewerLazy({ payload }: Building3DViewerLazyProps) {
  return <Building3DViewer payload={payload} />;
}
