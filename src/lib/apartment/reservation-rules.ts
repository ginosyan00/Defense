import type { ApartmentStatus, ReservationStatus } from "@prisma/client";

export const RESERVATION_HOLD_HOURS = 48;

const BLOCKING_RESERVATION: ReservationStatus[] = ["PENDING", "CONFIRMED"];

export function isApartmentReservable(status: ApartmentStatus): boolean {
  return status === "AVAILABLE";
}

export function isBlockingReservationStatus(
  status: ReservationStatus,
): boolean {
  return BLOCKING_RESERVATION.includes(status);
}

export function reservationHoldExpiresAt(
  from: Date = new Date(),
  hours = RESERVATION_HOLD_HOURS,
): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}
