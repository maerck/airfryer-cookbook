import { createElement, type ReactNode } from "react";
import { renderToString } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import ListaComprasClient from "@/components/ListaComprasClient";
import ReceitaDetalhe from "@/components/ReceitaDetalhe";
import { paramsReceitas, RECEITAS, receitaPorId, TOTAL_RECEITAS } from "@/lib/data";
import { normalizar } from "@/lib/filters";
import { agregarListaCompras, contarListaCompras, textoListaCompras } from "@/lib/shopping";
import {
  contemTermo,
  ingredienteCoberto,
  listarIngredientesUnicos,
  normalizarTenho,
  pontuarReceita,
  sugerirReceitas,
} from "@/lib/suggest";
import type { Receita } from "@/lib/types";

vi.mock("next/link", async () => {
  const { createElement } = await import("react");
  return {
    default: ({ href, children }: { href: string; children?: ReactNode }) =>
      createElement("a", { href }, children),
  };
});

function semComentarios(html: string): string {
  return html.replace(/<!--.*?-->/g, "");
}

const fixture: Receita = {
  id: 900,
  nome: "Esparguete com salmão",
  emoji: "🍝",
  metodo: "Air Fryer",
  cat: "Peixe & Marisco",
  tempo: 20,
  dificuldade: "Fácil",
  doses: 2,
  temp: "180°C",
  ingredientes: ["200 g de esparguete", "150 g de salmão", "sal q.b."],
  passos: ["Cozer a massa", "Saltear o salmão"],
  dica: "Usa salmão fresco.",
};

const outra: Receita = {
  ...fixture,
  id: 901,
  nome: "Arroz de pato",
  ingredientes: ["300 g de arroz", "sal q.b."],
};

describe("receitaPorId / paramsReceitas", () => {
  it("encontra receitas pelos ids 1..TOTAL_RECEITAS", () => {
    expect(receitaPorId(1)?.id).toBe(1);
    expect(receitaPorId(TOTAL_RECEITAS)?.id).toBe(TOTAL_RECEITAS);
    expect(receitaPorId(0)).toBeUndefined();
    expect(receitaPorId(TOTAL_RECEITAS + 1)).toBeUndefined();
    expect(receitaPorId(Number.NaN)).toBeUndefined();
  });

  it("paramsReceitas gera um param estático por receita, com id em string", () => {
    const params = paramsReceitas();
    expect(params).toHaveLength(TOTAL_RECEITAS);
    expect(params[0]).toEqual({ id: "1" });
    expect(params[TOTAL_RECEITAS - 1]).toEqual({ id: String(TOTAL_RECEITAS) });
  });
});

describe("listarIngredientesUnicos", () => {
  it("devolve ingredientes únicos ordenados em pt-PT", () => {
    const lista = listarIngredientesUnicos([fixture, outra]);
    expect(lista).toEqual(["150 g de salmão", "200 g de esparguete", "300 g de arroz", "sal q.b."]);
  });

  it("no dataset real não tem duplicados nem vazios", () => {
    const lista = listarIngredientesUnicos(RECEITAS);
    expect(new Set(lista).size).toBe(lista.length);
    expect(lista.every((x) => x.trim() !== "")).toBe(true);
    expect(lista.length).toBeGreaterThan(100);
  });
});

describe("contemTermo / ingredienteCoberto (matching difuso)", () => {
  it("casa palavras completas com limites Unicode", () => {
    expect(contemTermo("1 frango pequeno (~1,2 kg)", "frango")).toBe(true);
    expect(contemTermo("sal q.b.", "sal")).toBe(true);
    expect(contemTermo("salmão fresco", "sal")).toBe(false); // "sal" não casa dentro de "salmão"
    expect(contemTermo("salmão fresco", "salmão")).toBe(true);
    // contemTermo assume entradas já normalizadas (sem acentos, minúsculas)
    expect(contemTermo(normalizar("Pão de Ló"), "pao de lo")).toBe(true);
    expect(contemTermo("azeite", "azeit")).toBe(false);
    expect(contemTermo("", "sal")).toBe(false);
    expect(contemTermo("sal", "")).toBe(false);
  });

  it("ingredienteCoberto aceita igualdad exata ou containment de palavras", () => {
    const tenho = normalizarTenho(["frango"]);
    expect(ingredienteCoberto("1 frango pequeno (~1,2 kg)", tenho)).toBe(true);
    expect(ingredienteCoberto("sal q.b.", tenho)).toBe(false);
    const tenhoExato = normalizarTenho(["sal q.b."]);
    expect(ingredienteCoberto("Sal q.b.", tenhoExato)).toBe(true);
  });
});

describe("normalizarTenho / pontuarReceita", () => {
  it("normaliza e ignora entradas vazias", () => {
    const tenho = normalizarTenho(["Sal Q.B.", "  ", "Salmão"]);
    expect(tenho.has("sal q.b.")).toBe(true);
    expect(tenho.has(normalizar("SALMÃO"))).toBe(true);
    expect(tenho.size).toBe(2);
  });

  it("pontua a cobertura de ingredientes da receita", () => {
    const tenho = normalizarTenho(["200 g de esparguete", "sal q.b."]);
    const s = pontuarReceita(fixture, tenho);
    expect(s.cobertos).toBe(2);
    expect(s.total).toBe(3);
    expect(s.rácio).toBeCloseTo(2 / 3);
  });

  it("pontua por palavra: 'frango' cobre '1 frango pequeno'", () => {
    const receitaFrango: Receita = {
      ...fixture,
      id: 902,
      ingredientes: ["1 frango pequeno", "sal q.b."],
    };
    const s = pontuarReceita(receitaFrango, normalizarTenho(["frango"]));
    expect(s.cobertos).toBe(1);
    expect(s.total).toBe(2);
  });

  it("receita totalmente coberta tem rácio 1", () => {
    const tenho = normalizarTenho(fixture.ingredientes);
    expect(pontuarReceita(fixture, tenho).rácio).toBe(1);
  });
});

describe("sugerirReceitas", () => {
  const lista = [fixture, outra];

  it("ordena por rácio desc, depois tempo asc, depois id", () => {
    const tenho = normalizarTenho(["sal q.b."]);
    const resultado = sugerirReceitas(lista, tenho);
    // outra tem 1/2 coberto, fixture 1/3 → outra primeiro
    expect(resultado.map((s) => s.receita.id)).toEqual([901, 900]);
  });

  it("soCompletas só devolve receitas com rácio 1", () => {
    const tenho = normalizarTenho(["300 g de arroz", "sal q.b."]);
    const resultado = sugerirReceitas(lista, tenho, true);
    expect(resultado.map((s) => s.receita.id)).toEqual([901]);
  });

  it("sem ingredientes em casa devolve tudo com rácio 0, ordenado por tempo", () => {
    const resultado = sugerirReceitas([{ ...fixture, tempo: 30 }, fixture], normalizarTenho([]));
    expect(resultado.every((s) => s.rácio === 0)).toBe(true);
    expect(resultado[0]?.receita.tempo).toBe(20);
  });

  it("no dataset real, ter todos os ingredientes de uma receita torna-a completa", () => {
    const alvo = RECEITAS[0];
    if (!alvo) throw new Error("dataset vazio");
    const tenho = normalizarTenho(alvo.ingredientes);
    const completas = sugerirReceitas(RECEITAS, tenho, true);
    expect(completas.some((s) => s.receita.id === alvo.id && s.rácio === 1)).toBe(true);
    expect(completas[0]?.rácio).toBe(1);
  });
});

describe("agregarListaCompras / contarListaCompras", () => {
  it("agrega ingredientes marcados agrupados por receita, ordenados", () => {
    const marcados: Record<number, number[]> = { 900: [2, 0], 901: [1] };
    const itens = agregarListaCompras([fixture, outra], marcados);
    expect(itens.map((i) => [i.receitaId, i.indice])).toEqual([
      [900, 0],
      [900, 2],
      [901, 1],
    ]);
    expect(itens[0]?.ingrediente).toBe("200 g de esparguete");
    expect(itens[0]?.receitaNome).toBe("Esparguete com salmão");
    expect(itens[0]?.receitaEmoji).toBe("🍝");
  });

  it("ignora ids de receita inexistentes e índices inválidos", () => {
    const itens = agregarListaCompras([fixture], { 999: [0], 900: [99, -1] });
    expect(itens).toEqual([]);
  });

  it("contarListaCompras soma todos os índices marcados", () => {
    expect(contarListaCompras({ 900: [0, 2], 901: [1] })).toBe(3);
    expect(contarListaCompras({})).toBe(0);
  });

  it("no dataset real agrega a partir de marcações válidas", () => {
    const r1 = receitaPorId(1);
    if (!r1) throw new Error("receita 1 em falta");
    const itens = agregarListaCompras(RECEITAS, { 1: [0] });
    expect(itens).toHaveLength(1);
    expect(itens[0]?.ingrediente).toBe(r1.ingredientes[0]);
  });
});

describe("textoListaCompras", () => {
  it("gera texto agrupado por receita", () => {
    const itens = agregarListaCompras([fixture, outra], { 900: [0, 2], 901: [0] });
    const texto = textoListaCompras(itens);
    expect(texto).toContain("🛒 Lista de compras");
    expect(texto).toContain("🍝 Esparguete com salmão");
    expect(texto).toContain("- 200 g de esparguete");
    expect(texto).toContain("- sal q.b.");
    // cabeçalho da segunda receita depois dos itens da primeira
    expect(texto.indexOf("Esparguete com salmão")).toBeLessThan(texto.indexOf("Arroz de pato"));
    expect(texto).toContain("- 300 g de arroz");
  });

  it("lista vazia devolve só o cabeçalho", () => {
    expect(textoListaCompras([])).toBe("🛒 Lista de compras");
  });
});

describe("SSR das novas páginas de M3", () => {
  it("ReceitaDetalhe mostra a receita completa com os passos e a dica", () => {
    const html = semComentarios(
      renderToString(createElement(ReceitaDetalhe, { receita: fixture })),
    );
    expect(html).toContain("Esparguete com salmão");
    expect(html).toContain("⏱ 20 min");
    expect(html).toContain("🌡 180°C");
    expect(html).toContain("🍽 2 doses");
    expect(html).toContain("200 g de esparguete");
    expect(html).toContain("Cozer a massa");
    expect(html).toContain("💡 Dica");
    expect(html).toContain("Imprimir");
    expect(html).toContain('href="/"');
  });

  it("ListaComprasClient (sem hidratação) mostra o estado vazio em pt-PT", () => {
    const html = semComentarios(renderToString(createElement(ListaComprasClient)));
    expect(html).toContain("🛒 Lista de compras");
    expect(html).toContain("A tua lista de compras está vazia.");
    expect(html).toContain("A lista está vazia");
    expect(html).toContain('href="/"');
  });
});
