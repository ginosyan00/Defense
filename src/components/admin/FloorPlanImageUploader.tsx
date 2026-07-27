"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { uploadFloorPlanImage } from "@/lib/admin/upload-floor-plan";
import { prepareImageForUpload } from "@/lib/media/prepare-image-upload";

type FloorPlanImageUploaderProps = {
  floorId: string;
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  floorNumber: number;
  currentImageUrl: string | null;
  /** Open file picker automatically when landing with #upload */
  autoOpen?: boolean;
};

export function FloorPlanImageUploader({
  floorId,
  projectSlug,
  districtSlug,
  buildingSlug,
  floorNumber,
  currentImageUrl,
  autoOpen = false,
}: FloorPlanImageUploaderProps) {
  const router = useRouter();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [highlight, setHighlight] = useState(false);
  const [pending, startTransition] = useTransition();

  const openFilePicker = () => {
    setHighlight(true);
    rootRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      inputRef.current?.click();
    }, 250);
    window.setTimeout(() => setHighlight(false), 2500);
  };

  useEffect(() => {
    const shouldOpen =
      autoOpen ||
      (typeof window !== "undefined" && window.location.hash === "#upload");

    if (shouldOpen) {
      openFilePicker();
    }

    const onOpenEvent = () => openFilePicker();
    window.addEventListener("open-floor-plan-upload", onOpenEvent);
    return () => {
      window.removeEventListener("open-floor-plan-upload", onOpenEvent);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- open once on mount / hash
  }, [autoOpen, floorId]);

  const onFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    startTransition(async () => {
      setMessage("Սեղմվում և բեռնվում է…");
      try {
        const prepared = await prepareImageForUpload(file);
        const formData = new FormData();
        formData.set("file", prepared.file);
        const result = await uploadFloorPlanImage({
          floorId,
          projectSlug,
          districtSlug,
          buildingSlug,
          floorNumber,
          width: prepared.width,
          height: prepared.height,
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
        if (typeof window !== "undefined" && window.location.hash === "#upload") {
          window.history.replaceState(
            null,
            "",
            `${window.location.pathname}${window.location.search}`,
          );
        }
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
    <div
      ref={rootRef}
      id="upload"
      className={`space-y-3 border p-4 transition ${
        highlight
          ? "border-[#e07a2f] bg-[#e07a2f]/10 ring-2 ring-[#e07a2f]/40"
          : "border-[var(--mp-line)]"
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-[family-name:var(--font-display)] text-xl">
            Հատակագծի նկար · upload
          </h2>
          <p className="mt-1 text-xs text-[var(--mp-ink-muted)]">
            Շենքի նարնջագույն գոտուն սեղմելուց հետո այստեղ upload արա այդ հարկի
            հատակագիծը, հետո գծիր բնակարանները։
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
          Հատակագիծ դեռ չկա։ Սեղմիր «Ավելացնել / փոխել նկար» կամ ընտրիր ֆայլը
          բացված պատուհանից։
        </p>
      )}

      {message ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">{message}</p>
      ) : null}
    </div>
  );
}
