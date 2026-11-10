/**
 * Valida data/recipes.json, data/recipes/*.json e data/modelos.json contra os schemas zod e
 * imprime um resumo. Corre antes de cada re-upload de dados: `pnpm check:data` (exit 1 se
 * inválido). A sincronia entre data/recipes.json e data/recipes/ é garantida na CI por
 * `pnpm data:build --check`.
 */
import { readFileSync } from "node:fs";
import { validarFontes, validarModelos, validarReceitas } from "../lib/schemas.ts";
import type { Categoria, Metodo, Receita } from "../lib/types.ts";
import { lerDiretorioReceitas } from "./build-data.ts";

function lerJson(caminho: URL): unknown {
  return JSON.parse(readFileSync(caminho, "utf8")) as unknown;
}

function contar<T>(itens: readonly T[], chave: (item: T) => string): Record<string, number> {
  const mapa: Record<string, number> = {};
  for (const item of itens) {
    const k = chave(item);
    mapa[k] = (mapa[k] ?? 0) + 1;
  }
  return mapa;
}

function resumo(receitas: readonly Receita[]): string[] {
  const ids = receitas.map((r) => r.id);
  const sequencial = ids.every((id, i) => id === i + 1);
  const linhas = [
    `receitas: ${receitas.length} (ids ${Math.min(...ids)}..${Math.max(...ids)}${sequencial ? ", sequenciais" : ", NÃO sequenciais"})`,
    `por método: ${Object.entries(contar(receitas, (r) => r.metodo as Metodo))
      .map(([k, v]) => `${k}=${v}`)
      .join(" · ")}`,
    `por categoria: ${Object.entries(contar(receitas, (r) => r.cat as Categoria))
      .map(([k, v]) => `${k}=${v}`)
      .join(" · ")}`,
    `por dificuldade: ${Object.entries(contar(receitas, (r) => r.dificuldade))
      .map(([k, v]) => `${k}=${v}`)
      .join(" · ")}`,
  ];
  return linhas;
}

try {
  const receitas = validarReceitas(lerJson(new URL("../data/recipes.json", import.meta.url)));
  const receitasDir = lerDiretorioReceitas();
  const modelos = validarModelos(lerJson(new URL("../data/modelos.json", import.meta.url)));
  const fontes = validarFontes(lerJson(new URL("../data/fontes.json", import.meta.url)));
  console.log("check:data OK");
  for (const linha of resumo(receitas)) console.log(`  ${linha}`);
  console.log(
    `  data/recipes/: ${receitasDir.length} ficheiros (<id>.json, ids sequenciais sem buracos)`,
  );
  console.log(`modelos: ${modelos.length} (${modelos.map((m) => m.id).join(", ")})`);
  console.log(
    fontes.length === 0
      ? "fontes: 0 registadas (data/fontes.json vazio — o dono regista fontes abertas)"
      : `fontes: ${fontes.length} (${fontes.map((f) => `${f.id} [${f.licenca}]`).join(", ")})`,
  );
} catch (erro) {
  console.error(`check:data FALHOU: ${erro instanceof Error ? erro.message : String(erro)}`);
  process.exit(1);
}
