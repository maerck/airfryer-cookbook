import { normalizar } from "./filters";
import type { Receita } from "./types";

export interface Sugestao {
  receita: Receita;
  cobertos: number; // ingredientes da receita que o utilizador tem
  total: number; // total de ingredientes da receita
  rácio: number; // cobertos / total (0..1)
}

/** Conjunto normalizado de ingredientes que o utilizador tem em casa. */
export type TenhoEmCasa = ReadonlySet<string>;

export function normalizarTenho(lista: readonly string[]): TenhoEmCasa {
  return new Set(lista.map((x) => normalizar(x.trim())).filter((x) => x !== ""));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Verdadeiro se `termo` ocorre em `texto` como palavra(s) completa(s) — limites Unicode,
 * para "sal" não casar com "salmão" mas "frango" casar com "1 frango pequeno".
 */
export function contemTermo(texto: string, termo: string): boolean {
  if (termo === "") return false;
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegex(termo)}(?![\\p{L}\\p{N}_])`, "iu");
  return re.test(texto);
}

/** Um ingrediente conta como "em casa" se for igual, ou conter/ser contido pelo termo. */
export function ingredienteCoberto(ingrediente: string, tenho: TenhoEmCasa): boolean {
  const norm = normalizar(ingrediente);
  for (const t of tenho) {
    if (norm === t || contemTermo(norm, t) || contemTermo(t, norm)) return true;
  }
  return false;
}

/** Ingredientes únicos do dataset, ordenados em pt-PT — para o autocompletar "tenho em casa". */
export function listarIngredientesUnicos(receitas: readonly Receita[]): string[] {
  const todos = new Set<string>();
  for (const r of receitas) {
    for (const ing of r.ingredientes) todos.add(ing);
  }
  return [...todos].sort((a, b) => a.localeCompare(b, "pt-PT"));
}

export function pontuarReceita(receita: Receita, tenho: TenhoEmCasa): Sugestao {
  let cobertos = 0;
  for (const ing of receita.ingredientes) {
    if (ingredienteCoberto(ing, tenho)) cobertos += 1;
  }
  const total = receita.ingredientes.length;
  return { receita, cobertos, total, rácio: total === 0 ? 1 : cobertos / total };
}

/**
 * Sugestões "o que posso cozinhar com o que tenho em casa": pontua cada receita pela
 * cobertura de ingredientes e ordena por rácio desc, depois tempo asc, depois id.
 */
export function sugerirReceitas(
  receitas: readonly Receita[],
  tenho: TenhoEmCasa,
  soCompletas = false,
): Sugestao[] {
  const sugestoes = receitas.map((r) => pontuarReceita(r, tenho));
  const filtradas = soCompletas ? sugestoes.filter((s) => s.rácio === 1) : sugestoes;
  return [...filtradas].sort(
    (a, b) => b.rácio - a.rácio || a.receita.tempo - b.receita.tempo || a.receita.id - b.receita.id,
  );
}
