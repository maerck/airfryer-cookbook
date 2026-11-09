// @vitest-environment jsdom

import axe from "axe-core";
import { beforeAll, describe, expect, it } from "vitest";
import { escapeHtml, type Rota, renderRotas } from "./helpers/rotas";

const NOMES_ROTAS = ["/", "/modelos", "/lista-compras", "/receita/1", "not-found"] as const;

let rotas: Rota[];

beforeAll(async () => {
  rotas = await renderRotas();
}, 120_000);

/** Carrega o HTML SSR da rota no documento jsdom (com <title> no <head>, como o Next serve). */
function carregar(r: Rota): void {
  document.documentElement.lang = "pt";
  document.head.innerHTML = `<meta charset="utf-8"/><meta name="viewport" content="width=device-width, initial-scale=1"/><title>${escapeHtml(r.titulo)}</title>`;
  document.body.className = r.bodyClass;
  document.body.innerHTML = r.bodyHtml;
}

type Impacto = "minor" | "moderate" | "serious" | "critical";

function relatorio(results: axe.AxeResults, impactos: Impacto[]): string[] {
  const pretendidos = new Set<string>(impactos);
  const lista: string[] = [];
  for (const v of results.violations) {
    if (v.impact && pretendidos.has(v.impact)) {
      const alvos = v.nodes
        .map((n) => n.target.join(" "))
        .slice(0, 3)
        .join(" | ");
      lista.push(`${v.id} [${v.impact}] ${v.help} — ${v.nodes.length} nó(s): ${alvos}`);
    }
  }
  return lista;
}

describe("axe sobre o HTML SSR de cada rota", () => {
  for (const nome of NOMES_ROTAS) {
    it(`rota ${nome}: zero violações serious/critical e zero moderate`, async () => {
      const r = rotas.find((x) => x.rota === nome);
      if (!r) throw new Error(`rota em falta nos testes: ${nome}`);
      carregar(r);
      const results = await axe.run();
      expect(relatorio(results, ["critical", "serious"])).toEqual([]);
      expect(relatorio(results, ["moderate"])).toEqual([]);
    }, 60_000);
  }

  it("incomplete serious/critical limita-se a regras justificadas no jsdom", async () => {
    // Justificadas (revistas, nunca "violation"):
    // - color-contrast: o jsdom não aplica folhas de estilo, por isso o contraste fica sempre
    //   "incomplete"; o contraste real é dado pelas classes Tailwind (revisto em M8).
    // - label-content-name-mismatch: só os botões de favorito — o conteúdo visível é o emoji
    //   decorativo dentro de <span aria-hidden>; o nome acessível é o aria-label.
    const justificadas = new Set(["color-contrast", "label-content-name-mismatch"]);
    const pendentes: string[] = [];
    for (const r of rotas) {
      carregar(r);
      const results = await axe.run();
      for (const inc of results.incomplete) {
        if ((inc.impact === "critical" || inc.impact === "serious") && !justificadas.has(inc.id)) {
          pendentes.push(`${r.rota}: ${inc.id} [${inc.impact}] ${inc.help}`);
        }
      }
    }
    expect(pendentes).toEqual([]);
  }, 120_000);
});
