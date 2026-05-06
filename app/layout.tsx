import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToastProvider } from "@/contexts/ToastContext";
import "./globals.css";

export const metadata: Metadata = {
  title: "OXO Carriers — Payroll System",
  description: "Employee Payroll Management System",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-[var(--background)] text-[var(--foreground)]">
        <ToastProvider>
          {children}
        </ToastProvider>
      </body>
    </html>
  );
}
