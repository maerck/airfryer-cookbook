import type { MetadataRoute } from "next";
import { paramsReceitas } from "@/lib/data";

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const rotas = [
    "",
    "/modelos",
    "/lista-compras",
    ...paramsReceitas().map((p) => `/receita/${p.id}`),
  ];
  return rotas.map((rota) => ({
    url: new URL(rota, SITE_URL).toString(),
  }));
}
