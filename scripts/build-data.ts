/**
 * Une data/recipes/*.json -> data/recipes.json (ordenado por id) e faz o inverso, sem alterar
 * conteúdo: a app e os testes continuam a ler data/recipes.json (ficheiro gerado, no git).
 * - pnpm data:build          : gera data/recipes.json a partir de data/recipes/
 * - pnpm data:build --check  : exit 1 se data/recipes.json não estiver em sincronia (corre na CI)
 * - pnpm data:split          : (re)gera data/recipes/<id>.json a partir de data/recipes.json,
 *                              para o re-upload completo de M5 continuar a funcionar
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { receitaSchema, validarReceitas } from "../lib/schemas.ts";
import type { Receita } from "../lib/types.ts";

export const DIR_RECEITAS = new URL("../data/recipes/", import.meta.url);
export const FICHEIRO_RECEITAS = new URL("../data/recipes.json", import.meta.url);

function lerJson(caminho: URL): unknown {
  return JSON.parse(readFileSync(caminho, "utf8")) as unknown;
}

export function carregarFicheiroReceitas(ficheiro: URL = FICHEIRO_RECEITAS): Receita[] {
  return validarReceitas(lerJson(ficheiro), "data/recipes.json");
}

/**
 * Lê e valida data/recipes/*.json: nome do ficheiro = `<id>.json`, ids únicos, inteiros positivos
 * e sequenciais a partir de 1 (sem buracos). Devolve as receitas ordenadas por id.
 */
export function lerDiretorioReceitas(dir: URL = DIR_RECEITAS): Receita[] {
  const nomes = readdirSync(dir)
    .filter((n) => n.endsWith(".json"))
    .sort((a, b) => a.localeCompare(b, "pt", { numeric: true }));
  if (nomes.length === 0) throw new Error("data/recipes/ sem ficheiros .json");
  const receitas: Receita[] = [];
  const ids = new Set<number>();
  for (const nome of nomes) {
    const r = receitaSchema.parse(lerJson(new URL(nome, dir)));
    if (nome !== `${r.id}.json`) {
      throw new Error(
        `${nome} inválido: o nome do ficheiro deve ser <id>.json (receita id ${r.id})`,
      );
    }
    if (ids.has(r.id)) throw new Error(`${nome} inválido: id duplicado ${r.id}`);
    ids.add(r.id);
    receitas.push(r);
  }
  receitas.forEach((r, i) => {
    if (r.id !== i + 1) {
      throw new Error(`ids não sequenciais a partir de 1: esperado ${i + 1}, encontrado ${r.id}`);
    }
  });
  return receitas;
}

export function montarFicheiroReceita(receita: Receita): string {
  return `${JSON.stringify(receita, null, 2)}\n`;
}

export function montarJson(receitas: readonly Receita[]): string {
  return `${JSON.stringify(receitas, null, 2)}\n`;
}

/** Gera data/recipes.json a partir de data/recipes/; devolve true se o ficheiro mudou. */
export function gerarFicheiroUnido(
  dir: URL = DIR_RECEITAS,
  ficheiro: URL = FICHEIRO_RECEITAS,
): boolean {
  const conteudo = montarJson(lerDiretorioReceitas(dir));
  if (existsSync(ficheiro) && readFileSync(ficheiro, "utf8") === conteudo) return false;
  writeFileSync(ficheiro, conteudo);
  return true;
}

/** (Re)gera data/recipes/<id>.json a partir de data/recipes.json, sem alterar conteúdo. */
export function gerarFicheirosPorReceita(
  ficheiro: URL = FICHEIRO_RECEITAS,
  dir: URL = DIR_RECEITAS,
): number {
  const receitas = carregarFicheiroReceitas(ficheiro);
  mkdirSync(dir, { recursive: true });
  for (const r of receitas) writeFileSync(new URL(`${r.id}.json`, dir), montarFicheiroReceita(r));
  return receitas.length;
}

/** Falha se o data/recipes.json combinado não for deep-equal ao gerado a partir de data/recipes/. */
export function verificarSincronia(
  dir: URL = DIR_RECEITAS,
  ficheiro: URL = FICHEIRO_RECEITAS,
): void {
  const doDir = montarJson(lerDiretorioReceitas(dir));
  const doFicheiro = montarJson(carregarFicheiroReceitas(ficheiro));
  if (doDir !== doFicheiro) {
    throw new Error(
      "data/recipes.json não está em sincronia com data/recipes/ — corre `pnpm data:build` e faz commit do resultado",
    );
  }
}

function main(argv: string[]): number {
  const arg = argv[2];
  const check = argv.includes("--check");
  try {
    if (arg === "split") {
      const n = gerarFicheirosPorReceita();
      console.log(`data:split OK — ${n} ficheiros em data/recipes/`);
    } else if (arg === undefined || arg === "build" || arg === "--check") {
      if (check) {
        verificarSincronia();
        console.log("data:build --check OK — data/recipes.json em sincronia com data/recipes/");
      } else {
        const mudou = gerarFicheiroUnido();
        console.log(
          mudou
            ? "data:build OK — data/recipes.json atualizado"
            : "data:build OK — já estava em sincronia",
        );
      }
    } else {
      console.error(`modo desconhecido: ${JSON.stringify(arg)} (usa build [--check] ou split)`);
      return 1;
    }
    return 0;
  } catch (erro) {
    console.error(`data:build FALHOU: ${erro instanceof Error ? erro.message : String(erro)}`);
    return 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(main(process.argv));
}
