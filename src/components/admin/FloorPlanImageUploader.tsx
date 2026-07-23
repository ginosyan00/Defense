"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { uploadFloorPlanImage } from "@/lib/admin/upload-floor-plan";

type FloorPlanImageUploaderProps = {
  floorId: string;
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorNumber: number;
  currentImageUrl: string | null;
};

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(url);
      resolve({ width: image.naturalWidth, height: image.naturalHeight });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Նկարը չհաջողվեց կարդալ"));
    };
    image.src = url;
  });
}

export function FloorPlanImageUploader({
  floorId,
  projectSlug,
  districtSlug,
  buildingSlug,
  floorNumber,
  currentImageUrl,
}: FloorPlanImageUploaderProps) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setMessage("Բեռնվում է…");
      try {
        const size = await readImageSize(file);
        const formData = new FormData();
        formData.set("file", file);
        const result = await uploadFloorPlanImage({
          floorId,
          projectSlug,
          districtSlug,
          buildingSlug,
          floorNumber,
          width: size.width,
          height: size.height,
          clearApartmentPolygons: true,
          formData,
        });
        if (!result.ok) {
          setMessage(result.error);
          return;
        }
        setMessage(
          `✓ Հատակագիծը պահպանված է (${result.width}×${result.height}). Հին բնակարանների polygon-ները մաքրվել են — վերագծիր և կապիր։`,
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
            Հատակագծի նկար
          </h2>
          <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
            Upload արա հատակագիծը, հետո գծիր բնակարանների տարածքները և կապիր
            apartment entity-ին։
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

      {currentImageUrl ? (
        <div className="max-w-xl overflow-hidden border border-[var(--mp-line)] bg-[#1a1c1f]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={currentImageUrl}
            alt="Floor plan preview"
            className="h-auto w-full object-contain"
          />
        </div>
      ) : (
        <p className="text-sm text-amber-800">
          Հատակագիծ դեռ չկա։ Ավելացրու նկար՝ բնակարաններ գծելու համար։
        </p>
      )}

      {message ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
