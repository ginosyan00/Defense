import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import Link from "next/link";
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
    default: "Defense Residence",
    template: "%s · Defense Residence",
  },
  description:
    "Interactive real-estate platform with aerial masterplan navigation.",
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
          <div className="border-b border-[var(--mp-line)] px-4 py-3 md:px-8">
            <Link
              href="/projects/defense-residence"
              className="font-[family-name:var(--font-display)] text-lg tracking-wide"
            >
              Defense Residence
            </Link>
          </div>
          <div className="flex-1">{children}</div>
        </div>
      </body>
    </html>
  );
}
