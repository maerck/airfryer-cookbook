import recipesJson from "@/data/recipes.json";
import { validarReceitas } from "./schemas";
import type { Categoria, Dificuldade, Metodo, Receita } from "./types";

export const RECEITAS: readonly Receita[] = validarReceitas(recipesJson);
export const TOTAL_RECEITAS = RECEITAS.length;

export const METODOS: readonly Metodo[] = ["Air Fryer", "Vapor", "Vapor + Ar"];
export const CATEGORIAS: readonly Categoria[] = [
  "Carne",
  "Peixe & Marisco",
  "Vegetariano",
  "Acompanhamentos & Lanches",
  "Doces",
];

export const DIFICULDADES: readonly Dificuldade[] = ["Muito fácil", "Fácil", "Média"];

/** Ordem de severidade para ordenação por dificuldade. */
export const DIFICULDADE_ORDEM: Record<Dificuldade, number> = {
  "Muito fácil": 0,
  Fácil: 1,
  Média: 2,
};

export const METODO_EMOJI: Record<Metodo, string> = {
  "Air Fryer": "🔥",
  Vapor: "💨",
  "Vapor + Ar": "🔁",
};

export const METODO_CHIP: Record<Metodo, string> = {
  "Air Fryer": "Air Fryer",
  Vapor: "Vapor",
  "Vapor + Ar": "Combinação",
};

export const CORES_METODO: Record<Metodo, string> = {
  "Air Fryer":
    "border-amber-200 bg-amber-100 text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200",
  Vapor:
    "border-sky-200 bg-sky-100 text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200",
  "Vapor + Ar":
    "border-violet-200 bg-violet-100 text-violet-800 dark:border-violet-900 dark:bg-violet-950 dark:text-violet-200",
};

export const CORES_CAT: Record<Categoria, string> = {
  Carne:
    "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900 dark:bg-rose-950 dark:text-rose-200",
  "Peixe & Marisco":
    "border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-900 dark:bg-cyan-950 dark:text-cyan-200",
  Vegetariano:
    "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200",
  "Acompanhamentos & Lanches":
    "border-orange-200 bg-orange-50 text-orange-700 dark:border-orange-900 dark:bg-orange-950 dark:text-orange-200",
  Doces:
    "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700 dark:border-fuchsia-900 dark:bg-fuchsia-950 dark:text-fuchsia-200",
};

export function contarPorMetodo(): Record<Metodo, number> {
  const contagens = { "Air Fryer": 0, Vapor: 0, "Vapor + Ar": 0 } as Record<Metodo, number>;
  for (const r of RECEITAS) contagens[r.metodo] += 1;
  return contagens;
}

export function contarPorCategoria(): Record<Categoria, number> {
  const contagens = {
    Carne: 0,
    "Peixe & Marisco": 0,
    Vegetariano: 0,
    "Acompanhamentos & Lanches": 0,
    Doces: 0,
  } as Record<Categoria, number>;
  for (const r of RECEITAS) contagens[r.cat] += 1;
  return contagens;
}

export function receitaPorId(id: number): Receita | undefined {
  return RECEITAS.find((r) => r.id === id);
}

/** Params estáticos para a rota /receita/[id] (uma entrada por receita). */
export function paramsReceitas(): { id: string }[] {
  return RECEITAS.map((r) => ({ id: String(r.id) }));
}
