import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import ThemeProvider from "@/components/ThemeProvider";
import WebMCPTools from "@/components/WebMCPTools";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "200 Receitas · Air Fryer & Vapor",
  description:
    "200 receitas em português europeu concebidas para a Xiaomi Mijia Smart Steam Air Fryer 7 L — ar quente, vapor e modo combinado. Filtra por método ou categoria, guarda as favoritas e marca os ingredientes.",
  openGraph: {
    title: "200 Receitas · Air Fryer & Vapor",
    description:
      "Receitas para a Xiaomi Mijia Smart Steam Air Fryer 7 L — ar quente, vapor e modo combinado.",
    type: "website",
    locale: "pt_PT",
  },
};

export const viewport: Viewport = {
  themeColor: "#1c1917",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="bg-stone-100 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <ThemeProvider>
          <WebMCPTools />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
