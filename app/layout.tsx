import type { Metadata } from "next";
import { Bricolage_Grotesque, Public_Sans, Noto_Sans_Devanagari } from "next/font/google";
import "./globals.css";

const display = Bricolage_Grotesque({ subsets: ["latin"], variable: "--f-display", display: "swap" });
const body = Public_Sans({ subsets: ["latin"], variable: "--f-body", display: "swap" });
// Only used when the report is switched to Hindi.
const deva = Noto_Sans_Devanagari({
  subsets: ["devanagari"],
  weight: ["400", "600", "700"],
  variable: "--f-deva",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Parakh | Test your startup idea",
  description: "Check a startup idea against live Google data (search demand, apps, news and jobs) before you build it.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable} ${deva.variable}`}>
      <body>{children}</body>
    </html>
  );
}
