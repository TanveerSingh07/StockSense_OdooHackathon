import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

import { Navbar } from "@/components/layout/navbar";

export const metadata: Metadata = {
  title: "StockSense — Modular Inventory Management System",
  description: "Real-time stock ledger, receipts, deliveries, and warehouse logistics",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased dark`}
    >
      <body className="min-h-full flex flex-col bg-[#0D1117] text-[#F0F6FC] font-sans antialiased">
        <Navbar />
        <main className="flex-1 min-w-0">{children}</main>
      </body>
    </html>
  );
}
