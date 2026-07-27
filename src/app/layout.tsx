import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { SiteHeader } from "@/components/site/SiteHeader";
import { getPrimaryPublicProject } from "@/lib/site/get-primary-public-project";
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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const primary = await getPrimaryPublicProject();

  return (
    <html lang="hy" className={`${display.variable} ${sans.variable} h-full`}>
      <body className="min-h-full bg-[var(--mp-canvas)] font-[family-name:var(--font-sans)] text-[var(--mp-ink)] antialiased">
        <div className="flex min-h-full flex-col">
          <SiteHeader
            brandName={primary?.name ?? "North Yard"}
            masterplanHref="/"
          />
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
