import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { AppProvider } from "@/components/providers/app-provider";

export const metadata: Metadata = {
  title: "FinanceAI",
  description: "AI-powered Finance, Tax and Loan Assistant",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en">
      <body><AppProvider>{children}</AppProvider></body>
    </html>
  );
}