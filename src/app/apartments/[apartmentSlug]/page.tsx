import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ApartmentPlanDrawing } from "@/components/apartment/ApartmentPlanDrawing";
import { ConsultationForm } from "@/components/apartment/ConsultationForm";
import { getApartmentDetails } from "@/lib/apartment/get-apartment-details";
import {
  apartmentStatusLabel,
  formatMoney,
} from "@/lib/floor/apartment-status";

type ApartmentPageProps = {
  params: Promise<{ apartmentSlug: string }>;
};

export async function generateMetadata({
  params,
}: ApartmentPageProps): Promise<Metadata> {
  const { apartmentSlug } = await params;
  const payload = await getApartmentDetails(apartmentSlug);
  if (!payload) return { title: "Apartment not found" };
  return {
    title: `Բնակարան ${payload.apartment.apartmentNumber} · ${payload.project.name}`,
    description:
      payload.apartment.description ??
      `${payload.building.name}, հարկ ${payload.floor.floorNumber}, ${payload.apartment.totalArea} մ²`,
  };
}

export default async function ApartmentPage({ params }: ApartmentPageProps) {
  const { apartmentSlug } = await params;
  const payload = await getApartmentDetails(apartmentSlug);
  if (!payload) notFound();

  const { apartment } = payload;
  const reservationDisabled =
    apartment.status === "SOLD" || apartment.status === "RESERVED";

  return (
    <main className="min-h-full bg-[var(--mp-canvas)] text-[var(--mp-ink)]">
      <header className="border-b border-[var(--mp-line)] px-4 py-5 md:px-8">
        <div className="mx-auto max-w-5xl">
          <p className="text-[11px] uppercase tracking-[0.22em] text-[var(--mp-ink-muted)]">
            <Link
              href={`/projects/${payload.project.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.project.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={`/projects/${payload.project.slug}/districts/${payload.district.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.district.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={`/projects/${payload.project.slug}/districts/${payload.district.slug}/buildings/${payload.building.slug}`}
              className="underline-offset-4 hover:underline"
            >
              {payload.building.name}
            </Link>
            <span aria-hidden> / </span>
            <Link
              href={payload.floorPlanHref}
              className="underline-offset-4 hover:underline"
            >
              {payload.floor.name}
            </Link>
          </p>
          <h1 className="mt-2 font-[family-name:var(--font-display)] text-4xl md:text-5xl">
            Բնակարան {apartment.apartmentNumber}
          </h1>
          <p className="mt-2 text-sm uppercase tracking-[0.16em] text-[var(--mp-ink-muted)]">
            {apartmentStatusLabel(apartment.status)}
          </p>
        </div>
      </header>

      <div className="mx-auto grid max-w-5xl gap-10 px-4 py-10 md:grid-cols-[1.2fr_0.8fr] md:px-8">
        <section className="space-y-8">
          <div className="grid grid-cols-2 gap-4 text-sm md:grid-cols-3">
            <Spec label="Նախագիծ" value={payload.project.name} />
            <Spec label="Թաղամաս" value={payload.district.name} />
            <Spec label="Շենք" value={payload.building.name} />
            <Spec
              label="Մուտք"
              value={
                payload.entrance
                  ? `${payload.entrance.name} (${payload.entrance.number})`
                  : "—"
              }
            />
            <Spec label="Հարկ" value={String(payload.floor.floorNumber)} />
            <Spec label="Սենյակներ" value={String(apartment.rooms)} />
            <Spec label="Ննջասենյակներ" value={String(apartment.bedrooms)} />
            <Spec label="Սանհանգույցներ" value={String(apartment.bathrooms)} />
            <Spec label="Պատշգամբներ" value={String(apartment.balconies)} />
            <Spec label="Ընդհանուր մակերես" value={`${apartment.totalArea} մ²`} />
            <Spec label="Բնակելի մակերես" value={`${apartment.livingArea} մ²`} />
            <Spec label="Պատշգամբ" value={`${apartment.balconyArea} մ²`} />
            <Spec label="Առաստաղ" value={`${apartment.ceilingHeight} մ`} />
            <Spec label="Կողմնորոշում" value={apartment.orientation ?? "—"} />
            <Spec label="Տեսարան" value={apartment.viewType ?? "—"} />
            <Spec
              label="Գին"
              value={formatMoney(apartment.price, apartment.currency)}
            />
            <Spec
              label="Գին / մ²"
              value={formatMoney(
                apartment.pricePerSquareMeter,
                apartment.currency,
              )}
            />
          </div>

          {apartment.description ? (
            <p className="text-[var(--mp-ink-muted)]">{apartment.description}</p>
          ) : null}

          <div>
            <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl">
              Հատակագիծ
            </h2>
            <ApartmentPlanDrawing
              apartmentNumber={apartment.apartmentNumber}
              rooms={apartment.rooms}
              bedrooms={apartment.bedrooms}
              bathrooms={apartment.bathrooms}
              balconies={apartment.balconies}
              totalArea={apartment.totalArea}
              livingArea={apartment.livingArea}
              balconyArea={apartment.balconyArea}
              status={apartment.status}
            />
            {apartment.pdfUrl ? (
              <a
                href={apartment.pdfUrl}
                className="mt-3 inline-block text-xs uppercase tracking-[0.14em] underline-offset-4 hover:underline"
                download
              >
                Ներբեռնել PDF
              </a>
            ) : (
              <p className="mt-3 text-xs text-[var(--mp-ink-muted)]">
                PDF դեռ հասանելի չէ։ Վերևում ցուցադրվում է ինտերակտիվ SVG
                հատակագիծը։
              </p>
            )}
          </div>

          {payload.media.length > 0 ? (
            <div>
              <h2 className="mb-3 font-[family-name:var(--font-display)] text-2xl">
                Պատկերասրահ
              </h2>
              <ul className="grid grid-cols-2 gap-3">
                {payload.media.map((item) => (
                  <li key={item.id} className="border border-[var(--mp-line)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={item.url}
                      alt={item.alt ?? `Apartment media ${item.type}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <aside>
          <ConsultationForm
            apartmentSlug={apartment.slug}
            apartmentNumber={apartment.apartmentNumber}
            reservationDisabled={reservationDisabled}
          />
          <Link
            href={payload.floorPlanHref}
            className="mt-4 inline-block text-xs uppercase tracking-[0.14em] text-[var(--mp-ink-muted)] underline-offset-4 hover:underline"
          >
            ← Վերադառնալ հատակագիծ
          </Link>
        </aside>
      </div>
    </main>
  );
}

function Spec({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] uppercase tracking-[0.12em] text-[var(--mp-ink-muted)]">
        {label}
      </p>
      <p className="mt-1">{value}</p>
    </div>
  );
}
