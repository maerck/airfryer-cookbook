import recipesJson from "@/data/recipes.json";
import { CATEGORIAS, METODOS } from "./constants";
import { validarReceitas } from "./schemas";
import type { Categoria, Metodo, Receita } from "./types";

// Reexporta as constantes para quem já importa o dataset; componentes que não precisam das
// receitas devem importar de lib/constants (ver o comentário nesse módulo).
export {
  CATEGORIAS,
  CORES_CAT,
  CORES_METODO,
  DIFICULDADE_ORDEM,
  DIFICULDADES,
  METODO_CHIP,
  METODO_EMOJI,
  METODOS,
} from "./constants";

export const RECEITAS: readonly Receita[] = validarReceitas(recipesJson);
export const TOTAL_RECEITAS = RECEITAS.length;

function contar<T extends string>(valores: readonly T[], de: (r: Receita) => T): Record<T, number> {
  const contagens = Object.fromEntries(valores.map((v) => [v, 0])) as Record<T, number>;
  for (const r of RECEITAS) contagens[de(r)] += 1;
  return contagens;
}

export function contarPorMetodo(): Record<Metodo, number> {
  return contar(METODOS, (r) => r.metodo);
}

export function contarPorCategoria(): Record<Categoria, number> {
  return contar(CATEGORIAS, (r) => r.cat);
}

export function receitaPorId(id: number): Receita | undefined {
  return RECEITAS.find((r) => r.id === id);
}

/** Receitas imediatamente antes e depois (pela ordem do dataset) — navegação em /receita/[id]. */
export function vizinhasDaReceita(id: number): { anterior?: Receita; seguinte?: Receita } {
  const i = RECEITAS.findIndex((r) => r.id === id);
  if (i < 0) return {};
  return { anterior: RECEITAS[i - 1], seguinte: RECEITAS[i + 1] };
}

/** Params estáticos para a rota /receita/[id] (uma entrada por receita). */
export function paramsReceitas(): { id: string }[] {
  return RECEITAS.map((r) => ({ id: String(r.id) }));
}
