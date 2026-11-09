import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import RegisterSW from "@/components/RegisterSW";
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
  alternates: {
    canonical: "/",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f5f5f4" },
    { media: "(prefers-color-scheme: dark)", color: "#1c1917" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <html lang="pt" suppressHydrationWarning>
      <body className="bg-stone-100 text-stone-900 antialiased dark:bg-stone-950 dark:text-stone-100">
        <a
          href="#conteudo"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-amber-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
        >
          Saltar para o conteúdo
        </a>
        <ThemeProvider>
          <WebMCPTools />
          <RegisterSW />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
