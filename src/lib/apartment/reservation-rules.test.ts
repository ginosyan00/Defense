import { describe, expect, it } from "vitest";
import {
  isApartmentReservable,
  isBlockingReservationStatus,
  reservationHoldExpiresAt,
  RESERVATION_HOLD_HOURS,
} from "@/lib/apartment/reservation-rules";

describe("reservation rules", () => {
  it("only AVAILABLE apartments can be reserved", () => {
    expect(isApartmentReservable("AVAILABLE")).toBe(true);
    expect(isApartmentReservable("RESERVED")).toBe(false);
    expect(isApartmentReservable("SOLD")).toBe(false);
    expect(isApartmentReservable("HIDDEN")).toBe(false);
  });

  it("treats PENDING and CONFIRMED as blocking", () => {
    expect(isBlockingReservationStatus("PENDING")).toBe(true);
    expect(isBlockingReservationStatus("CONFIRMED")).toBe(true);
    expect(isBlockingReservationStatus("EXPIRED")).toBe(false);
    expect(isBlockingReservationStatus("CANCELLED")).toBe(false);
  });

  it("computes hold expiry from now", () => {
    const from = new Date("2026-07-27T10:00:00.000Z");
    const expires = reservationHoldExpiresAt(from);
    expect(expires.toISOString()).toBe(
      new Date(
        from.getTime() + RESERVATION_HOLD_HOURS * 60 * 60 * 1000,
      ).toISOString(),
    );
  });
});
