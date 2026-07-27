"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/db";
import {
  isApartmentReservable,
  isBlockingReservationStatus,
  reservationHoldExpiresAt,
} from "@/lib/apartment/reservation-rules";

const consultationSchema = z.object({
  apartmentSlug: z.string().min(1).max(120),
  mode: z.enum(["consult", "reserve"]),
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(6).max(40),
  email: z.union([z.string().trim().email().max(160), z.literal("")]),
  message: z.union([z.string().trim().max(2000), z.literal("")]),
});

export type ConsultationActionResult =
  | { ok: true; mode: "consult" | "reserve"; holdExpiresAt: string | null }
  | { ok: false; error: string };

export async function submitConsultation(
  input: z.infer<typeof consultationSchema>,
): Promise<ConsultationActionResult> {
  const parsed = consultationSchema.safeParse(input);
  if (!parsed.success) {
    return {
      ok: false,
      error: "Լրացրեք պարտադիր դաշտերը ճիշտ ձևով։",
    };
  }

  const data = parsed.data;
  const email = data.email ? data.email : null;
  const message = data.message ? data.message : null;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const apartment = await tx.apartment.findUnique({
        where: { slug: data.apartmentSlug },
        select: {
          id: true,
          slug: true,
          status: true,
          apartmentNumber: true,
          floor: {
            select: {
              floorNumber: true,
              building: {
                select: {
                  slug: true,
                  district: {
                    select: {
                      slug: true,
                      project: { select: { slug: true } },
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!apartment || apartment.status === "HIDDEN") {
        return { ok: false as const, error: "Բնակարանը չի գտնվել։" };
      }

      if (data.mode === "reserve") {
        if (!isApartmentReservable(apartment.status)) {
          return {
            ok: false as const,
            error: "Այս բնակարանը հասանելի չէ ամրագրման համար։",
          };
        }

        const active = await tx.reservation.findFirst({
          where: {
            apartmentId: apartment.id,
            status: { in: ["PENDING", "CONFIRMED"] },
          },
          select: { id: true, status: true },
        });

        if (active && isBlockingReservationStatus(active.status)) {
          return {
            ok: false as const,
            error: "Բնակարանը արդեն ամրագրված է։ Ընտրեք խորհրդատվություն։",
          };
        }
      }

      const lead = await tx.lead.create({
        data: {
          apartmentId: apartment.id,
          name: data.name,
          phone: data.phone,
          email,
          message,
          preferredContactMethod: "PHONE",
          source:
            data.mode === "reserve"
              ? "apartment-page-reserve"
              : "apartment-page-consult",
          status: "NEW",
        },
      });

      let holdExpiresAt: Date | null = null;

      if (data.mode === "reserve") {
        holdExpiresAt = reservationHoldExpiresAt();
        await tx.reservation.create({
          data: {
            apartmentId: apartment.id,
            leadId: lead.id,
            status: "PENDING",
            holdExpiresAt,
            notes: message,
          },
        });
        await tx.apartment.update({
          where: { id: apartment.id },
          data: { status: "RESERVED" },
        });
      }

      return {
        ok: true as const,
        mode: data.mode,
        holdExpiresAt,
        apartment,
      };
    });

    if (!result.ok) {
      return { ok: false, error: result.error };
    }

    const { apartment } = result;
    const projectSlug = apartment.floor.building.district.project.slug;
    const districtSlug = apartment.floor.building.district.slug;
    const buildingSlug = apartment.floor.building.slug;
    const floorNumber = apartment.floor.floorNumber;

    revalidatePath(`/apartments/${apartment.slug}`);
    revalidatePath(
      `/projects/${projectSlug}/districts/${districtSlug}/buildings/${buildingSlug}/floors/${floorNumber}`,
    );

    return {
      ok: true,
      mode: result.mode,
      holdExpiresAt: result.holdExpiresAt?.toISOString() ?? null,
    };
  } catch {
    return {
      ok: false,
      error: "Չհաջողվեց ուղարկել։ Փորձեք մի փոքր ուշ։",
    };
  }
}
