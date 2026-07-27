"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { setupBuildingFloorsAndRender } from "@/lib/admin/setup-building-floors";

type BuildingFloorSetupFormProps = {
  projectSlug: string;
  districtSlug: string;
  buildingSlug: string;
  buildingName: string;
  initialFloorCount: number;
  hasImage: boolean;
};

function readImageSize(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const image = new Image();
    image.onload = () => {
      const width = image.naturalWidth;
      const height = image.naturalHeight;
      URL.revokeObjectURL(url);
      resolve({ width, height });
    };
    image.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Նկարը չհաջողվեց կարդալ"));
    };
    image.src = url;
  });
}

export function BuildingFloorSetupForm({
  projectSlug,
  districtSlug,
  buildingSlug,
  buildingName,
  initialFloorCount,
  hasImage,
}: BuildingFloorSetupFormProps) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [floorCount, setFloorCount] = useState(
    String(Math.max(initialFloorCount, 1)),
  );
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 space-y-3 border border-[var(--mp-line)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);

        const count = Number(floorCount);
        if (!Number.isInteger(count) || count < 1 || count > 60) {
          setError("Հարկերի քանակը պետք է լինի 1–60։");
          return;
        }

        const file = fileRef.current?.files?.[0] ?? null;
        if (!file && !hasImage) {
          setError("Ավելացրու շենքի նկարը։");
          return;
        }

        startTransition(async () => {
          try {
            const formData = new FormData();
            let width: number | undefined;
            let height: number | undefined;
            if (file) {
              const size = await readImageSize(file);
              width = size.width;
              height = size.height;
              formData.set("file", file);
            }

            const result = await setupBuildingFloorsAndRender({
              projectSlug,
              districtSlug,
              buildingSlug,
              floorCount: count,
              width,
              height,
              formData,
            });

            if (!result.ok) {
              setError(result.error);
              return;
            }

            router.push(result.href);
            router.refresh();
          } catch (err) {
            setError(err instanceof Error ? err.message : "Սխալ տեղի ունեցավ։");
          }
        });
      }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em]">
        Setup · {buildingName}
      </p>
      <p className="text-xs text-[var(--mp-ink-muted)]">
        Գրիր հարկերի քանակը, upload արա շենքի նկարը, հետո կբացվի գծելու էջը։
      </p>

      <label className="block space-y-1 text-xs">
        <span className="uppercase tracking-[0.14em]">Հարկերի քանակ</span>
        <input
          type="number"
          min={1}
          max={60}
          required
          value={floorCount}
          onChange={(event) => setFloorCount(event.target.value)}
          className="w-full border border-[var(--mp-line)] bg-[var(--mp-panel)] px-3 py-2 text-sm"
        />
      </label>

      <label className="block space-y-1 text-xs">
        <span className="uppercase tracking-[0.14em]">
          Շենքի նկար {hasImage ? "(փոխել — ոչ պարտադիր)" : ""}
        </span>
        <input
          ref={fileRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/avif,image/svg+xml"
          required={!hasImage}
          onChange={(event) => {
            setFileName(event.target.files?.[0]?.name ?? null);
          }}
          className="block w-full text-sm file:mr-3 file:border file:border-[var(--mp-line)] file:bg-[var(--mp-panel)] file:px-3 file:py-1.5 file:text-xs file:uppercase file:tracking-[0.14em]"
        />
        {fileName ? (
          <span className="text-[var(--mp-ink-muted)]">{fileName}</span>
        ) : hasImage ? (
          <span className="text-[var(--mp-ink-muted)]">
            Նկար արդեն կա։ Կարող ես նորով փոխել կամ թողնել։
          </span>
        ) : null}
      </label>

      {error ? <p className="text-xs text-red-700">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-50"
      >
        {pending ? "Պահպանվում…" : "Սկսել հարկեր map"}
      </button>
    </form>
  );
}
