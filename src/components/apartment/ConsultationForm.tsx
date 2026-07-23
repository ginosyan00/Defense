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
  const [submitted, setSubmitted] = useState(false);
  const [mode, setMode] = useState<"consult" | "reserve">("consult");

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    // Phase 7 will persist Lead / Reservation with conflict protection.
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="border border-[var(--mp-line)] bg-[var(--mp-panel)] p-5 text-sm">
        Հարցումը ընդունված է։ Մեր մասնագետը կապ կհաստատի ձեզ հետ։
        <p className="mt-2 text-xs text-[var(--mp-ink-muted)]">
          ({mode === "reserve" ? "Ամրագրում" : "Խորհրդատվություն"} ·{" "}
          {apartmentSlug})
        </p>
      </div>
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
          onClick={() => setMode("consult")}
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
          onClick={() => setMode("reserve")}
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

      <button
        type="submit"
        className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)]"
      >
        Ուղարկել
      </button>
    </form>
  );
}
