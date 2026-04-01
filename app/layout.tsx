import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payroll System",
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
        {children}
      </body>
    </html>
  );
}
