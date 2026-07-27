"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadDistrictPlanImage } from "@/lib/admin/upload-district-plan";
import { prepareImageForUpload } from "@/lib/media/prepare-image-upload";

type DistrictPlanImageUploaderProps = {
  districtId: string;
  projectSlug: string;
  districtSlug: string;
  currentImageUrl: string;
};

export function DistrictPlanImageUploader({
  districtId,
  projectSlug,
  districtSlug,
  currentImageUrl,
}: DistrictPlanImageUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setMessage("Սեղմվում և բեռնվում է…");
      try {
        const prepared = await prepareImageForUpload(file);
        const formData = new FormData();
        formData.set("file", prepared.file);
        const result = await uploadDistrictPlanImage({
          districtId,
          projectSlug,
          districtSlug,
          width: prepared.width,
          height: prepared.height,
          clearBuildingPolygons: true,
          formData,
        });
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setMessage(
          `✓ Թաղամասի նկարը պահպանված է (${result.width}×${result.height}). Հին շենքերի polygon-ները մաքրվել են — վերագծիր։`,
        );
        router.refresh();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Upload-ը ձախողվեց",
        );
      } finally {
        if (inputRef.current) inputRef.current.value = "";
      }
    });
  };

  return (
    <div className="space-y-3 border border-[var(--mp-line)] p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Թաղամասի նկար
          </h2>
          <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
            Aerial / site plan · PNG JPEG WebP AVIF SVG · մինչև 16MB։ Նոր նկար
            upload-ից հետո շենքերի հին գծագրերը մաքրվում են։
          </p>
        </div>
        <button
          type="button"
          className="border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-50"
          disabled={pending}
          onClick={() => inputRef.current?.click()}
        >
          {pending ? "Բեռնվում…" : "Ավելացնել / փոխել նկար"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
          className="hidden"
          onChange={onFileChange}
        />
      </div>

      <div className="max-w-xl overflow-hidden border border-[var(--mp-line)] bg-[#1a1c1f]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={currentImageUrl}
          alt="District plan preview"
          className="h-auto w-full object-contain"
        />
      </div>

      {message ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
