import { InteractiveImageMappingEditor } from "@/components/mapping-editor/InteractiveImageMappingEditor";
import Link from "next/link";

export default function MappingLabPage() {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)]">
            Phase 2 · MVP
          </p>
          <h1 className="font-[family-name:var(--font-display)] text-3xl">
            Interactive mapping lab
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-[var(--mp-ink-muted)]">
            Universal drawing editor sandbox. Draw polygons, edit vertices,
            undo/redo, zoom/pan. Coordinates stay normalized 0–1.
          </p>
        </div>
        <Link
          href="/admin"
          className="text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
        >
          ← Admin home
        </Link>
      </div>
      <InteractiveImageMappingEditor
        imageUrl="/mapping/placeholder-masterplan.svg"
        imageWidth={1600}
        imageHeight={900}
      />
    </div>
  );
}
