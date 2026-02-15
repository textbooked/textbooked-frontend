import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthButton } from "@/components/auth/auth-button";
import { AuthGuard } from "@/components/auth/auth-guard";
import { AuthProvider } from "@/components/auth/auth-provider";
import { Toaster } from "@/components/ui/sonner";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Textbooked",
  description: "Convert any textbook into structured lessons.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen bg-muted/30 antialiased`}
      >
        <AuthProvider>
          <AuthGuard>
            <div className="min-h-screen">
              <header className="border-b bg-background">
                <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
                  <Link href="/" className="text-sm font-semibold tracking-tight">
                    Textbooked
                  </Link>
                  <AuthButton />
                </div>
              </header>

              <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
                {children}
              </main>
            </div>
          </AuthGuard>

          <Toaster richColors position="top-right" />
        </AuthProvider>
      </body>
    </html>
  );
}
