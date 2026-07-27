import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteHeader";
import "./globals.css";

const display = Cormorant_Garamond({
  variable: "--font-display",
  subsets: ["latin", "cyrillic"],
  weight: ["500", "600", "700"],
});

const sans = Manrope({
  variable: "--font-sans",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "North Yard",
    template: "%s · North Yard",
  },
  description:
    "Ինտերակտիվ անշարժ գույքի հարթակ՝ aerial masterplan-ից մինչև բնակարանի ընտրություն։",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="hy" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full bg-[var(--mp-canvas)] font-[family-name:var(--font-sans)] text-[var(--mp-ink)] antialiased">
        <div className="flex min-h-full flex-col">
          <SiteHeader brandName="North Yard" masterplanHref="/" />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
