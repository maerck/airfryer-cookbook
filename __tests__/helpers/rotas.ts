import { createElement, type ReactElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { vi } from "vitest";
import { SITE_URL } from "@/lib/site";

/**
 * Mocks mínimos do Next para renderizar as rotas fora do servidor: o Link vira um <a> simples
 * (mantendo os atributos de acessibilidade) e o next/navigation devolve valores neutros.
 * Os módulos das rotas são importados dinamicamente em renderRotas(), depois destes mocks.
 */
vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({
      href,
      children,
      className,
      title,
      "aria-label": ariaLabel,
    }: {
      href: string;
      children?: ReactNode;
      className?: string;
      title?: string;
      "aria-label"?: string;
    }) => createElement("a", { href, className, title, "aria-label": ariaLabel }, children),
  };
});

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: () => {}, push: () => {}, prefetch: () => {} }),
  usePathname: () => "/",
  useSearchParams: () => new URLSearchParams(),
  notFound: (): never => {
    throw new Error("NEXT_NOT_FOUND");
  },
}));

/** Uma rota renderizada em HTML estático, como o Next a serviria (com <title> no <head>). */
export interface Rota {
  /** Identificador da rota nos testes: "/", "/modelos", "/lista-compras", "/receita/1", "not-found". */
  rota: string;
  /** Título da página, lido dos metadados exportados pela própria rota. */
  titulo: string;
  /** URL absoluta usada no teste de acessibilidade. */
  url: string;
  /** Documento completo: doctype + <html> + <head> com <title> + <body>. */
  html: string;
  /** innerHTML do <body> (para carregar no jsdom nos testes axe). */
  bodyHtml: string;
  /** class do <body>. */
  bodyClass: string;
}

export function escapeHtml(texto: string): string {
  return texto.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** React insere comentários entre nós de texto; remove-os antes de comparar strings. */
export function semComentarios(html: string): string {
  return html.replace(/<!--.*?-->/g, "");
}

function tituloDe(title: unknown): string {
  return typeof title === "string" ? title : "";
}

const META_HEAD =
  '<head><meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/>';

/**
 * Renderiza as cinco rotas da app (layout raiz + página) para HTML estático e devolve cada uma
 * como documento completo, com o <title> que os metadados da rota definem.
 */
export async function renderRotas(): Promise<Rota[]> {
  const layout = await import("@/app/layout");
  const tituloLayout = tituloDe(layout.metadata.title);

  async function comLayout(
    children: ReactElement,
    titulo: string,
    rota: string,
    path: string,
  ): Promise<Rota> {
    const layoutHtml = renderToString(createElement(layout.default, { children }));
    const htmlMatch = /^<html([^>]*)>([\s\S]*)<\/html>$/.exec(layoutHtml);
    // React 19 insere um <head></head> vazio; o <body> pode não ser o primeiro filho.
    const bodyMatch = htmlMatch?.[2] ? /<body([^>]*)>([\s\S]*)<\/body>/.exec(htmlMatch[2]) : null;
    if (!htmlMatch || !bodyMatch) {
      throw new Error(`layout inesperado: ${layoutHtml.slice(0, 200)}`);
    }
    const htmlAttrs = htmlMatch[1] ?? "";
    const bodyAttrs = bodyMatch[1] ?? "";
    const bodyHtml = bodyMatch[2] ?? "";
    const bodyClass = /class="([^"]*)"/.exec(bodyAttrs)?.[1] ?? "";
    const head = `${META_HEAD}<title>${escapeHtml(titulo)}</title></head>`;
    const html = `<!DOCTYPE html><html${htmlAttrs}>${head}<body${bodyAttrs}>${bodyHtml}</body></html>`;
    return { rota, titulo, url: `${SITE_URL}${path}`, html, bodyHtml, bodyClass };
  }

  const rotas: Rota[] = [];

  const home = await import("@/app/page");
  rotas.push(await comLayout(createElement(home.default), tituloLayout, "/", "/"));

  const modelos = await import("@/app/modelos/page");
  rotas.push(
    await comLayout(
      createElement(modelos.default),
      tituloDe(modelos.metadata.title),
      "/modelos",
      "/modelos",
    ),
  );

  const lista = await import("@/app/lista-compras/page");
  rotas.push(
    await comLayout(
      createElement(lista.default),
      tituloDe(lista.metadata.title),
      "/lista-compras",
      "/lista-compras",
    ),
  );

  const receita = await import("@/app/receita/[id]/page");
  const props = { params: Promise.resolve({ id: "1" }) };
  const elemento = await receita.default(props);
  const meta = await receita.generateMetadata(props);
  rotas.push(await comLayout(elemento, tituloDe(meta.title), "/receita/1", "/receita/1"));

  const nf = await import("@/app/not-found");
  rotas.push(await comLayout(createElement(nf.default), tituloLayout, "not-found", "/receita/999"));

  return rotas;
}
