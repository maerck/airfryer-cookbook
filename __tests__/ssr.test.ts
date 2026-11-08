import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import Header from "@/components/Header";
import ModelosClient from "@/components/ModelosClient";
import { MODELO_PADRAO } from "@/lib/models";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children }: { href: string; children?: ReactNode }) =>
      createElement("a", { href }, children),
  };
});

/** React insere comentários entre nós de texto; remove-os antes de comparar strings. */
function semComentarios(html: string): string {
  return html.replace(/<!--.*?-->/g, "");
}

describe("Header com o modelo padrão (SSR)", () => {
  const html = semComentarios(renderToString(createElement(Header, { modelo: MODELO_PADRAO })));

  it("mostra o título e subtítulo exatos de M1", () => {
    expect(html).toContain("200 Receitas · Air Fryer &amp; Vapor");
    expect(html).toContain("Concebidas para a Xiaomi Mijia Smart Steam Air Fryer 7 L");
  });

  it("mostra os chips de specs exatos de M1 (incl. vírgula decimal pt-PT)", () => {
    expect(html).toContain("🔥 1800 W · ar quente");
    expect(html).toContain("💨 900 W · vapor (depósito 1,5 L ≈ 90 min)");
    expect(html).toContain("📚 +100 receitas na app Xiaomi Home");
  });

  it("liga à secção /modelos", () => {
    expect(html).toContain('href="/modelos"');
    expect(html).toContain("🧺 Modelos");
  });
});

describe("Página /modelos (SSR com modelo padrão)", () => {
  const html = semComentarios(renderToString(createElement(ModelosClient)));

  it("lista o modelo Xiaomi como ativo por defeito", () => {
    expect(html).toContain("Modelos de airfryer");
    expect(html).toContain("Mijia Smart Steam Air Fryer 7 L");
    expect(html).toContain("✓ Modelo ativo");
    expect(html).toContain("1 modelo disponível");
    expect(html).toContain("Sem ajuste");
  });

  it("tem specs do modelo e link de volta às receitas", () => {
    expect(html).toContain("🔥 1800 W · ar quente");
    expect(html).toContain("💨 900 W · vapor (depósito 1,5 L ≈ 90 min)");
    expect(html).toContain("🧺 7 L");
    expect(html).toContain('href="/"');
  });
});
