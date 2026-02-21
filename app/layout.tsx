import type { Metadata } from "next";

import { themeFonts } from "@/lib/theme/fonts";
import { buildThemeInitScript } from "@/lib/theme/theme";
import AppProviders from "@/providers/app-providers";

import "./globals.css";

export const metadata: Metadata = {
  title: "Textbooked",
  description: "Convert any textbook into structured lessons.",
};

const themeInitScript = buildThemeInitScript();

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript }}
        />
      </head>
      <body
        suppressHydrationWarning
        className={`${themeFonts.bodyClassName} min-h-screen bg-muted/30 antialiased`}
      >
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
