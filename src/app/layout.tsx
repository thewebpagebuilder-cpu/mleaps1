import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Outfit, Plus_Jakarta_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const outfit = Outfit({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-outfit",
});

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-jakarta",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title:
    "Mleaps Consulting | Six Sigma Green Belt Certification Assessment",
  description:
    "Official Six Sigma Green Belt Mock Examination & Proctored Assessment Platform by Mleaps Consulting. 25 Multiple Choice Questions, Time-Windowed Email Authorization, and Real-Time DMAIC Analytics.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfit.variable} ${plusJakarta.variable} ${jetbrainsMono.variable} dark`}
    >
      <body
        style={{ fontFamily: "var(--font-jakarta), sans-serif" }}
        className="bg-[#0B1020] text-[#E7EAF3] antialiased min-h-screen selection:bg-[#F97316] selection:text-white overflow-x-hidden"
      >
        {children}
      </body>
    </html>
  );
}
