import type { Metadata } from "next";

import { themeFonts } from "@/lib/theme/fonts";
import { THEME_FAVICON_LINK_ID } from "@/lib/theme/consts";
import {
  buildThemeInitScript,
  getThemeFaviconHref,
} from "@/lib/theme/theme";
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
        <link
          id={THEME_FAVICON_LINK_ID}
          rel="icon"
          type="image/x-icon"
          href={getThemeFaviconHref("light")}
        />
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
