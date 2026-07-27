"use client";

import { useState, type FormEvent } from "react";

type ConsultationFormProps = {
  apartmentSlug: string;
  apartmentNumber: string;
  reservationDisabled: boolean;
};

export function ConsultationForm({
  apartmentSlug,
  apartmentNumber,
  reservationDisabled,
}: ConsultationFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"consult" | "reserve">("consult");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Persistence (Lead / Reservation) is not wired yet — do not fake success.
    setError(
      "Հարցումների համակարգը դեռ միացված չէ։ Խնդրում ենք կապվել վաճառքի բաժնի հետ անմիջապես։",
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-4 border border-[var(--mp-line)] bg-[var(--mp-panel)] p-5"
    >
      <div className="flex gap-2">
        <button
          type="button"
          className={`flex-1 border px-3 py-2 text-xs uppercase tracking-[0.14em] ${
            mode === "consult"
              ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
              : "border-[var(--mp-line)]"
          }`}
          onClick={() => {
            setMode("consult");
            setError(null);
          }}
        >
          Խորհրդատվություն
        </button>
        <button
          type="button"
          className={`flex-1 border px-3 py-2 text-xs uppercase tracking-[0.14em] disabled:cursor-not-allowed disabled:opacity-40 ${
            mode === "reserve"
              ? "border-[var(--mp-ink)] bg-[var(--mp-ink)] text-[var(--mp-panel)]"
              : "border-[var(--mp-line)]"
          }`}
          disabled={reservationDisabled}
          onClick={() => {
            setMode("reserve");
            setError(null);
          }}
        >
          Ամրագրում
        </button>
      </div>

      {reservationDisabled ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">
          Այս բնակարանի համար ամրագրումը հասանելի չէ։ Կարող եք խնդրել
          խորհրդատվություն։
        </p>
      ) : null}

      <p className="text-sm text-[var(--mp-ink-muted)]">
        Բնակարան {apartmentNumber}
        <span className="sr-only"> ({apartmentSlug})</span>
      </p>

      <label className="block text-sm">
        Անուն
        <input
          required
          name="name"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Հեռախոս
        <input
          required
          name="phone"
          type="tel"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Էլ. փոստ
        <input
          name="email"
          type="email"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Հաղորդագրություն
        <textarea
          name="message"
          rows={3}
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
        className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)]"
      >
        Ուղարկել
      </button>
    </form>
  );
}
