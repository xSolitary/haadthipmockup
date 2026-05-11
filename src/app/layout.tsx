import type { Metadata } from "next";
import { Geist_Mono, Sarabun } from "next/font/google";
import "./globals.css";
import { AppShell } from "@/components/layout/AppShell";

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const sarabun = Sarabun({
  variable: "--font-sarabun",
  subsets: ["latin", "thai"],
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "HaadThip Procurement Portal",
  description: "แบบจำลองระบบจัดซื้อสำหรับบริษัท หาดทิพย์ จำกัด (มหาชน)",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="th"
      className={`${geistMono.variable} ${sarabun.variable} h-full antialiased`}
    >
      <body className="min-h-full bg-[var(--background)] text-slate-900">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
