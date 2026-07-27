"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createApartment,
  createBuilding,
  createDistrict,
  createFloor,
  createProject,
} from "@/lib/admin/project-actions";

type CreateProjectFormProps = {
  defaultError?: string | null;
};

export function CreateProjectForm({ defaultError }: CreateProjectFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(defaultError ?? null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="space-y-3 border border-[var(--mp-ink)] bg-[var(--mp-panel)] p-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          const result = await createProject({
            name: String(form.get("name") ?? ""),
            location: String(form.get("location") ?? "") || undefined,
          });
          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(result.href);
          router.refresh();
        });
      }}
    >
      <p className="text-[11px] uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
        Նոր նախագիծ
      </p>
      <p className="font-[family-name:var(--font-display)] text-xl">
        Create · անուն գրիր
      </p>
      <label className="block text-sm">
        Անուն
        <input
          name="name"
          required
          minLength={2}
          placeholder="օր. North Yard"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Տեղանք (ոչ պարտադիր)
        <input
          name="location"
          placeholder="Yerevan, Armenia"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      {error ? (
        <p className="text-sm text-[var(--mp-ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-4 py-3 text-xs uppercase tracking-[0.16em] text-[var(--mp-panel)] disabled:opacity-50"
      >
        {pending ? "Ստեղծվում է…" : "Create նախագիծ"}
      </button>
    </form>
  );
}

type Field = {
  name: string;
  label: string;
  placeholder?: string;
  required?: boolean;
  defaultValue?: string;
};

type CreateEntityFormProps = {
  title: string;
  submitLabel: string;
  fields: Field[];
  hidden?: Record<string, string | number>;
  action: "district" | "building" | "floor" | "apartment";
};

export function CreateEntityForm({
  title,
  submitLabel,
  fields,
  hidden = {},
  action,
}: CreateEntityFormProps) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <form
      className="mt-4 space-y-2 border border-[var(--mp-line)] p-3"
      onSubmit={(event) => {
        event.preventDefault();
        setError(null);
        const form = new FormData(event.currentTarget);
        const values: Record<string, string> = {};
        for (const [key, value] of form.entries()) {
          values[key] = String(value);
        }
        for (const [key, value] of Object.entries(hidden)) {
          values[key] = String(value);
        }

        startTransition(async () => {
          let result;
          if (action === "district") {
            result = await createDistrict({
              projectSlug: values.projectSlug ?? "",
              name: values.name ?? "",
              markerLabel: values.markerLabel || undefined,
            });
          } else if (action === "building") {
            result = await createBuilding({
              projectSlug: values.projectSlug ?? "",
              districtSlug: values.districtSlug ?? "",
              name: values.name ?? "",
              buildingNumber: values.buildingNumber || undefined,
            });
          } else if (action === "floor") {
            result = await createFloor({
              projectSlug: values.projectSlug ?? "",
              districtSlug: values.districtSlug ?? "",
              buildingSlug: values.buildingSlug ?? "",
              name: values.name || undefined,
            });
          } else {
            result = await createApartment({
              projectSlug: values.projectSlug ?? "",
              districtSlug: values.districtSlug ?? "",
              buildingSlug: values.buildingSlug ?? "",
              floorNumber: Number(values.floorNumber),
              apartmentNumber: values.apartmentNumber ?? "",
            });
          }

          if (!result.ok) {
            setError(result.error);
            return;
          }
          router.push(result.href);
          router.refresh();
        });
      }}
    >
      <p className="text-xs font-medium uppercase tracking-[0.14em]">{title}</p>
      {Object.entries(hidden).map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={String(value)} />
      ))}
      {fields.map((field) => (
        <label key={field.name} className="block text-sm">
          {field.label}
          <input
            name={field.name}
            required={field.required !== false}
            placeholder={field.placeholder}
            defaultValue={field.defaultValue}
            className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-2 py-1.5"
          />
        </label>
      ))}
      {error ? (
        <p className="text-xs text-[var(--mp-ink-muted)]" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-2 text-xs uppercase tracking-[0.14em] text-[var(--mp-panel)] disabled:opacity-50"
      >
        {pending ? "…" : submitLabel}
      </button>
    </form>
  );
}
