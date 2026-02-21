import { Geist, Geist_Mono } from "next/font/google";

export const THEME_FONT_SANS_VARIABLE = "--font-textbooked-sans";
export const THEME_FONT_MONO_VARIABLE = "--font-textbooked-mono";

const sansFont = Geist({
  variable: "--font-textbooked-sans",
  subsets: ["latin"],
});

const monoFont = Geist_Mono({
  variable: "--font-textbooked-mono",
  subsets: ["latin"],
});

export const themeFonts = {
  sans: sansFont,
  mono: monoFont,
  sansVariable: THEME_FONT_SANS_VARIABLE,
  monoVariable: THEME_FONT_MONO_VARIABLE,
  bodyClassName: `${sansFont.variable} ${monoFont.variable} font-sans`,
} as const;
