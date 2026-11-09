import type { MetadataRoute } from "next";
import { paramsReceitas } from "@/lib/data";
import { SITE_URL, SITE_URL_POR_CONFIGURAR } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  if (SITE_URL_POR_CONFIGURAR && process.env.NODE_ENV === "production") {
    console.warn(
      "[sitemap] NEXT_PUBLIC_SITE_URL não está definido: sitemap.xml, robots.txt e Open Graph vão apontar para http://localhost:3000. Define-o antes de publicar.",
    );
  }
  // /lista-compras fica de fora: é uma página pessoal (localStorage), sem conteúdo para indexar
  const rotas = ["", "/modelos", ...paramsReceitas().map((p) => `/receita/${p.id}`)];
  return rotas.map((rota) => ({
    url: new URL(rota, SITE_URL).toString(),
    lastModified: new Date(),
  }));
}
