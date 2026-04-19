import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Paise — AI money coach for modern India",
  description:
    "Paise is an AI-powered personal finance platform built for India. Build FD ladders, track expenses, plan goals, and chat with a finance coach — in English or Hindi.",
};

export const viewport: Viewport = {
  themeColor: "#00d4aa",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className="font-sans antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
