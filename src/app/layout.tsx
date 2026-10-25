import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";

export const metadata: Metadata = {
  title: "JobAssist — Client Relationship Management & Candidate Portal",
  description: "Track candidate lifecycle, applications, daily quotas, interviews, and payments.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#FAF7F2] text-[#182232] antialiased">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
