/**
 * Enumerações e constantes de apresentação — fonte única para tipos, schemas zod, filtros e UI.
 * Este módulo não importa os datasets: componentes cliente que só precisam destas constantes
 * devem importá-las daqui (e não de `lib/data`) para não arrastarem as receitas para o bundle.
 */

export const METODOS = ["Air Fryer", "Vapor", "Vapor + Ar"] as const;
export type Metodo = (typeof METODOS)[number];

export const CATEGORIAS = [
  "Carne",
  "Peixe & Marisco",
  "Vegetariano",
  "Acompanhamentos & Lanches",
  "Doces",
] as const;
export type Categoria = (typeof CATEGORIAS)[number];

export const DIFICULDADES = ["Muito fácil", "Fácil", "Média"] as const;
export type Dificuldade = (typeof DIFICULDADES)[number];

export const ORDENS = ["padrao", "tempo", "tempo-desc", "nome", "dificuldade"] as const;
export type Ordem = (typeof ORDENS)[number];

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
