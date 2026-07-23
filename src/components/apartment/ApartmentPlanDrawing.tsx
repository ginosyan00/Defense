import type { ApartmentPlanStatus } from "@/types/floor-plan";

export type ApartmentPlanDrawingProps = {
  apartmentNumber: string;
  rooms: number;
  bedrooms: number;
  bathrooms: number;
  balconies: number;
  totalArea: number;
  livingArea: number;
  balconyArea: number;
  status: ApartmentPlanStatus;
};

/**
 * Architectural unit plan rendered as SVG (not a raster placeholder).
 * Layout adapts to room / bedroom / bathroom / balcony counts.
 */
export function ApartmentPlanDrawing({
  apartmentNumber,
  rooms,
  bedrooms,
  bathrooms,
  balconies,
  totalArea,
  livingArea,
  balconyArea,
  status,
}: ApartmentPlanDrawingProps) {
  const showSecondBedroom = bedrooms >= 2 || rooms >= 3;
  const showSecondBath = bathrooms >= 2;
  const showBalcony = balconies > 0 || balconyArea > 0;

  return (
    <figure className="border border-[var(--mp-line)] bg-[var(--mp-panel)]">
      <svg
        viewBox="0 0 900 640"
        className="h-auto w-full"
        role="img"
        aria-label={`Բնակարան ${apartmentNumber} հատակագիծ, ${totalArea} քառակուսի մետր`}
      >
        <defs>
          <pattern
            id="plan-hatch"
            width="10"
            height="10"
            patternUnits="userSpaceOnUse"
            patternTransform="rotate(45)"
          >
            <line
              x1="0"
              y1="0"
              x2="0"
              y2="10"
              stroke="rgba(109,103,92,0.25)"
              strokeWidth="1"
            />
          </pattern>
        </defs>

        <rect width="900" height="640" fill="#f7f4ee" />

        {/* Outer walls */}
        <rect
          x="48"
          y="40"
          width="804"
          height="520"
          fill="#efeae1"
          stroke="#2c2a26"
          strokeWidth="6"
        />

        {/* Living / kitchen */}
        <rect
          x="60"
          y="52"
          width={showSecondBedroom ? 420 : 520}
          height="300"
          fill="#e7e0d3"
          stroke="#6d675c"
          strokeWidth="2"
        />
        <RoomLabel
          x={showSecondBedroom ? 270 : 320}
          y="180"
          title="Հյուրասենյակ / Խոհանոց"
          subtitle={`${Math.max(18, Math.round(livingArea * 0.55))} մ²`}
        />

        {/* Kitchen island hint */}
        <rect
          x="90"
          y="280"
          width="160"
          height="48"
          fill="#d8d2c6"
          stroke="#6d675c"
          strokeWidth="1.5"
        />
        <text
          x="170"
          y="308"
          textAnchor="middle"
          fill="#5f645c"
          fontSize="12"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          Kitchen
        </text>

        {/* Primary bedroom */}
        <rect
          x={showSecondBedroom ? 500 : 600}
          y="52"
          width={showSecondBedroom ? 340 : 240}
          height="220"
          fill="#e2dccf"
          stroke="#6d675c"
          strokeWidth="2"
        />
        <RoomLabel
          x={showSecondBedroom ? 670 : 720}
          y="150"
          title="Ննջասենյակ 1"
          subtitle={`${Math.max(12, Math.round(livingArea * 0.28))} մ²`}
        />

        {/* Wardrobe */}
        <rect
          x={showSecondBedroom ? 510 : 610}
          y="62"
          width="28"
          height="120"
          fill="url(#plan-hatch)"
          stroke="#6d675c"
          strokeWidth="1"
        />

        {showSecondBedroom ? (
          <>
            <rect
              x="500"
              y="292"
              width="340"
              height="160"
              fill="#e2dccf"
              stroke="#6d675c"
              strokeWidth="2"
            />
            <RoomLabel
              x="670"
              y="360"
              title="Ննջասենյակ 2"
              subtitle={`${Math.max(10, Math.round(livingArea * 0.22))} մ²`}
            />
          </>
        ) : null}

        {/* Bathroom */}
        <rect
          x="60"
          y="370"
          width="180"
          height="178"
          fill="#d9e0db"
          stroke="#6d675c"
          strokeWidth="2"
        />
        <RoomLabel x="150" y="445" title="Սանհանգույց" subtitle="3–4 մ²" />
        <circle
          cx="110"
          cy="420"
          r="18"
          fill="none"
          stroke="#6d675c"
          strokeWidth="1.5"
        />
        <rect
          x="160"
          y="480"
          width="55"
          height="40"
          fill="#cfd8d2"
          stroke="#6d675c"
          strokeWidth="1.5"
        />

        {showSecondBath ? (
          <>
            <rect
              x="260"
              y="370"
              width="140"
              height="120"
              fill="#d9e0db"
              stroke="#6d675c"
              strokeWidth="2"
            />
            <RoomLabel x="330" y="425" title="WC 2" subtitle="" />
          </>
        ) : (
          <>
            <rect
              x="260"
              y="370"
              width="200"
              height="178"
              fill="#ebe4d8"
              stroke="#6d675c"
              strokeWidth="2"
            />
            <RoomLabel x="360" y="445" title="Միջանցք" subtitle="" />
          </>
        )}

        {/* Entrance door */}
        <path
          d="M 430 560 Q 470 520 510 560"
          fill="none"
          stroke="#2c2a26"
          strokeWidth="3"
        />
        <text
          x="470"
          y="590"
          textAnchor="middle"
          fill="#5f645c"
          fontSize="13"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          Մուտք
        </text>

        {showBalcony ? (
          <>
            <rect
              x="60"
              y="560"
              width="220"
              height="60"
              fill="#d5e0d4"
              stroke="#6d675c"
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <RoomLabel
              x="170"
              y="592"
              title="Պատշգամբ"
              subtitle={`${balconyArea || 6} մ²`}
            />
          </>
        ) : null}

        {/* Title plate */}
        <rect
          x="560"
          y="560"
          width="280"
          height="60"
          fill="#f4f2ec"
          stroke="#cfc9bc"
          strokeWidth="1"
        />
        <text
          x="700"
          y="585"
          textAnchor="middle"
          fill="#171916"
          fontSize="18"
          fontFamily="var(--font-display), Georgia, serif"
        >
          Բնակարան {apartmentNumber}
        </text>
        <text
          x="700"
          y="605"
          textAnchor="middle"
          fill="#5f645c"
          fontSize="12"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          {totalArea} մ² · {statusLabel(status)}
        </text>
      </svg>
      <figcaption className="border-t border-[var(--mp-line)] px-4 py-3 text-xs text-[var(--mp-ink-muted)]">
        Ճարտարապետական հատակագիծ · {rooms} սենյակ · {bedrooms} ննջասենյակ ·{" "}
        {bathrooms} սանհանգույց
        {showBalcony ? ` · պատշգամբ ${balconyArea || balconies} մ²` : ""}
      </figcaption>
    </figure>
  );
}

function RoomLabel({
  x,
  y,
  title,
  subtitle,
}: {
  x: number | string;
  y: number | string;
  title: string;
  subtitle: string;
}) {
  return (
    <>
      <text
        x={x}
        y={y}
        textAnchor="middle"
        fill="#171916"
        fontSize="15"
        fontFamily="var(--font-display), Georgia, serif"
      >
        {title}
      </text>
      {subtitle ? (
        <text
          x={x}
          y={Number(y) + 18}
          textAnchor="middle"
          fill="#5f645c"
          fontSize="12"
          fontFamily="var(--font-sans), system-ui, sans-serif"
        >
          {subtitle}
        </text>
      ) : null}
    </>
  );
}

function statusLabel(status: ApartmentPlanStatus): string {
  switch (status) {
    case "AVAILABLE":
      return "Հասանելի";
    case "RESERVED":
      return "Ամրագրված";
    case "SOLD":
      return "Վաճառված";
    default:
      return status;
  }
}
