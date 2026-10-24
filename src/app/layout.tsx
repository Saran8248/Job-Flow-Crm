import type { Metadata } from "next";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";

export const metadata: Metadata = {
  title: "JobAssist — Client Relationship Management System",
  description: "Manage clients, job applications, payments, staff assignments, and recruiter communications.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="bg-[#F9F6F0] text-[#182232] antialiased">
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 lg:ml-60 min-w-0 transition-all">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}
