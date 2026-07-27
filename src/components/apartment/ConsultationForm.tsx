"use client";

import { useState, useTransition, type FormEvent } from "react";
import { submitConsultation } from "@/lib/apartment/consultation-actions";
import { RESERVATION_HOLD_HOURS } from "@/lib/apartment/reservation-rules";

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
  const [submittedMode, setSubmittedMode] = useState<
    "consult" | "reserve" | null
  >(null);
  const [holdExpiresAt, setHoldExpiresAt] = useState<string | null>(null);
  const [mode, setMode] = useState<"consult" | "reserve">("consult");
  const [pending, startTransition] = useTransition();

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const form = new FormData(event.currentTarget);
    const payload = {
      apartmentSlug,
      mode,
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      email: String(form.get("email") ?? ""),
      message: String(form.get("message") ?? ""),
    };

    startTransition(async () => {
      const result = await submitConsultation(payload);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setSubmittedMode(result.mode);
      setHoldExpiresAt(result.holdExpiresAt);
    });
  }

  if (submittedMode) {
    return (
      <div className="border border-[var(--mp-line)] bg-[var(--mp-panel)] p-5 text-sm">
        <p>
          {submittedMode === "reserve"
            ? "Ամրագրումը ընդունված է։ Մեր մասնագետը կապ կհաստատի ձեզ հետ։"
            : "Հարցումը ընդունված է։ Մեր մասնագետը կապ կհաստատի ձեզ հետ։"}
        </p>
        {submittedMode === "reserve" && holdExpiresAt ? (
          <p className="mt-2 text-xs text-[var(--mp-ink-muted)]">
            Hold՝ {RESERVATION_HOLD_HOURS} ժամ · մինչև{" "}
            {new Date(holdExpiresAt).toLocaleString("hy-AM", {
              dateStyle: "medium",
              timeStyle: "short",
            })}
          </p>
        ) : null}
        <p className="mt-2 text-xs text-[var(--mp-ink-muted)]">
          Բնակարան {apartmentNumber}
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
      ) : mode === "reserve" ? (
        <p className="text-xs text-[var(--mp-ink-muted)]">
          Ամրագրումը ժամանակավոր hold է ({RESERVATION_HOLD_HOURS} ժամ) և
          արգելում է այլ ամրագրումներ նույն բնակարանի համար։
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
          autoComplete="name"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Հեռախոս
        <input
          required
          name="phone"
          type="tel"
          autoComplete="tel"
          className="mt-1 w-full border border-[var(--mp-line)] bg-transparent px-3 py-2"
        />
      </label>
      <label className="block text-sm">
        Էլ. փոստ
        <input
          name="email"
          type="email"
          autoComplete="email"
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
        disabled={pending}
        className="w-full border border-[var(--mp-ink)] bg-[var(--mp-ink)] px-3 py-3 text-xs uppercase tracking-[0.18em] text-[var(--mp-panel)] disabled:cursor-wait disabled:opacity-60"
      >
        {pending ? "Ուղարկվում է…" : "Ուղարկել"}
      </button>
    </form>
  );
}
