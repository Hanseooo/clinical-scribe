import type { Metadata } from "next";
import { DM_Sans, DM_Mono, Sora } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";
import { Navbar } from "@/components/navbar";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-display",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-body",
});

const dmMono = DM_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono-body",
});

export const metadata: Metadata = {
  title: {
    default: "ClinicalScribe - AI Clinical Handover Documentation",
    template: "%s | ClinicalScribe",
  },
  description:
    "Convert voice recordings or typed notes into structured clinical handover documents. Built for nursing students.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={cn(
        sora.variable,
        dmSans.variable,
        dmMono.variable,
        "font-sans"
      )}
    >
      <head>
        {/* eslint-disable-next-line @next/next/no-css-tags */}
        <link rel="stylesheet" href="/print.css" media="print" />
      </head>
      <body className="min-h-screen bg-stone-50 antialiased">
        <Navbar />
        {children}
      </body>
    </html>
  );
}
