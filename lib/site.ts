const URL_LOCAL = "http://localhost:3000";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * URL público do site, usado em sitemap.xml, robots.txt e metadados Open Graph.
 * Ordem: `NEXT_PUBLIC_SITE_URL` (explícito) → domínio de produção do projeto na Vercel
 * (`VERCEL_PROJECT_PRODUCTION_URL`, definido automaticamente em todos os deploys) → localhost.
 */
export function resolverSiteUrl(env: Env): string {
  const explicito = env.NEXT_PUBLIC_SITE_URL?.trim();
  if (explicito) return explicito.replace(/\/+$/, "");
  const vercel = env.VERCEL_PROJECT_PRODUCTION_URL?.trim();
  if (vercel) return `https://${vercel.replace(/\/+$/, "")}`;
  return URL_LOCAL;
}

export const SITE_URL = resolverSiteUrl(process.env);

/** Verdadeiro quando nenhum URL público foi configurado (o sitemap apontaria para localhost). */
export const SITE_URL_POR_CONFIGURAR = SITE_URL === URL_LOCAL;
