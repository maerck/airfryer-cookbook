import { beforeAll, describe, expect, it } from "vitest";
import { receitaPorId, TOTAL_RECEITAS } from "@/lib/data";
import { escapeHtml, type Rota, renderRotas, semComentarios } from "./helpers/rotas";

/** Número de cards que a home renderiza antes do botão "Mostrar mais" (renderização progressiva). */
const LIMITE_INICIAL = 24;

const NOMES_ROTAS = ["/", "/modelos", "/lista-compras", "/receita/1", "not-found"] as const;

let rotas: Rota[];

beforeAll(async () => {
  rotas = await renderRotas();
}, 120_000);

function rota(nome: (typeof NOMES_ROTAS)[number]): Rota {
  const r = rotas.find((x) => x.rota === nome);
  if (!r) throw new Error(`rota em falta nos testes: ${nome}`);
  return r;
}

describe("smoke por rota (HTML SSR)", () => {
  for (const nome of NOMES_ROTAS) {
    it(`rota ${nome}: documento pt com título e skip link`, () => {
      const r = rota(nome);
      const html = semComentarios(r.html);
      expect(html.startsWith('<!DOCTYPE html><html lang="pt">')).toBe(true);
      expect(r.titulo.length).toBeGreaterThan(0);
      expect(html).toContain(`<title>${escapeHtml(r.titulo)}</title>`);
      expect(html).toContain('href="#conteudo"');
      expect(html).toContain("Saltar para o conteúdo");
      expect(html).toContain('id="conteudo"');
    });
  }

  it("rota /: título e subtítulo do cabeçalho", () => {
    const r = rota("/");
    const html = semComentarios(r.html);
    expect(r.titulo).toBe("200 Receitas · Air Fryer & Vapor");
    expect(html).toContain("200 Receitas · Air Fryer &amp; Vapor");
    expect(html).toContain("Concebidas para a Xiaomi Mijia Smart Steam Air Fryer 7 L");
  });

  it("rota /: contador “A mostrar N de N” com o total do dataset", () => {
    const html = semComentarios(rota("/").html);
    const m = /A mostrar <strong[^>]*>(\d+)<\/strong> de (\d+) receitas/.exec(html);
    expect(m?.[1]).toBe(String(TOTAL_RECEITAS));
    expect(m?.[2]).toBe(String(TOTAL_RECEITAS));
  });

  it("rota /: 24 cards iniciais + botão “Mostrar mais”", () => {
    const html = semComentarios(rota("/").html);
    const cards = html.match(/id="receita-\d+"/g) ?? [];
    expect(cards).toHaveLength(LIMITE_INICIAL);
    expect(html).toContain(`Mostrar mais (${TOTAL_RECEITAS - LIMITE_INICIAL} restantes)`);
  });

  it("rota /: ligações do cabeçalho, pesquisa e chips de método", () => {
    const html = semComentarios(rota("/").html);
    expect(html).toContain('href="/lista-compras"');
    expect(html).toContain('href="/modelos"');
    expect(html).toContain('id="campo-pesquisa"');
    expect(html).toContain("Procurar por nome ou ingrediente");
    expect(html).toContain("Surpreende-me");
    expect(html).toContain(`Todos (${TOTAL_RECEITAS})`);
  });

  it("rota /modelos: título, modelo ativo por defeito e link para /", () => {
    const r = rota("/modelos");
    const html = semComentarios(r.html);
    expect(r.titulo).toBe("Modelos de airfryer · 200 Receitas · Air Fryer & Vapor");
    expect(html).toContain("Modelos de airfryer");
    expect(html).toContain("Mijia Smart Steam Air Fryer 7 L");
    expect(html).toContain("✓ Modelo ativo");
    expect(html).toContain("1 modelo disponível");
    expect(html).toContain('href="/"');
  });

  it("rota /lista-compras: título e estado vazio em pt-PT", () => {
    const r = rota("/lista-compras");
    const html = semComentarios(r.html);
    expect(r.titulo).toBe("Lista de compras · 200 Receitas · Air Fryer & Vapor");
    expect(html).toContain("🛒 Lista de compras");
    expect(html).toContain("A tua lista de compras está vazia.");
    expect(html).toContain("A lista está vazia");
    expect(html).toContain('href="/"');
  });

  it("rota /receita/1: título da receita, modo cozinhar e doseador", () => {
    const r1 = receitaPorId(1);
    if (!r1) throw new Error("receita 1 em falta no dataset");
    const r = rota("/receita/1");
    const html = semComentarios(r.html);
    expect(r.titulo).toBe(`${r1.nome} · 200 Receitas · Air Fryer & Vapor`);
    expect(html).toContain(escapeHtml(r1.nome));
    // modo cozinhar + doseador (M8/M9)
    expect(html).toContain("Modo cozinhar");
    expect(html).toContain(">Ajustar doses</legend>");
    expect(html).toContain('aria-label="Diminuir doses"');
    expect(html).toContain('aria-label="Aumentar doses"');
    expect(html).toContain(`${r1.doses} doses`);
    expect(html).toContain("Imprimir");
    expect(html).toContain("Partilhar");
    // um checkbox por ingrediente + navegação anterior/seguinte
    expect((html.match(/type="checkbox"/g) ?? []).length).toBe(r1.ingredientes.length);
    expect(html).toContain('href="/receita/2"');
    expect(html).toContain(`Ver as ${TOTAL_RECEITAS} receitas`);
  });

  it("rota not-found: mensagem pt-PT e link para as receitas", () => {
    const html = semComentarios(rota("not-found").html);
    expect(html).toContain("Página não encontrada.");
    expect(html).toContain(`Voltar às ${TOTAL_RECEITAS} receitas`);
    expect(html).toContain('href="/"');
  });
});
