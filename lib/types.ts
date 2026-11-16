import type { Categoria, Dificuldade, Metodo } from "./constants.ts";

// Os valores possíveis vivem em lib/constants.ts (fonte única); aqui só se reexportam os tipos.
export type { Categoria, Dificuldade, Metodo };

export interface AtribuicaoFonte {
  nome: string; // nome da fonte (ex.: site) — pt-PT quando aplicável
  url: string; // URL da receita original
  licenca: string; // ex.: "CC BY-SA 4.0"
  autores?: string[];
}

export interface Fonte {
  id: string; // slug único
  nome: string;
  url: string; // página/endpoint da fonte
  licenca: string; // só licenças abertas que permitem adaptação (ver LICENCAS_PERMITIDAS em lib/schemas.ts)
  termosAtribuicao?: string; // texto de atribuição exigido pela licença
}

export interface Receita {
  id: number; // inteiro positivo único, sequencial a partir de 1 (o dataset pode crescer)
  nome: string; // pt-PT
  emoji: string;
  metodo: Metodo;
  cat: Categoria;
  tempo: number; // total minutes (prep + cook)
  dificuldade: Dificuldade;
  doses: number;
  temp: string; // e.g. "200°C" | "Modo vapor" | "Vapor → 200°C"
  ingredientes: string[];
  passos: string[];
  dica?: string;
  fonte?: AtribuicaoFonte; // presente quando a receita foi adaptada de uma fonte aberta (M13)
}

export interface AjusteDelta {
  tempoMin: number; // delta (min)
  temperaturaC: number; // delta (°C)
}

export interface AjusteModelo {
  tempoMin: number; // delta (min) applied to every recipe's tempo
  temperaturaC: number; // delta (°C) applied to every numeric temperature in temp
  porMetodo?: Partial<Record<Metodo, AjusteDelta>>; // override opcional por método de confeção
}

export interface ModeloAirfryer {
  id: string; // slug, unique — persisted in localStorage as the active model
  marca: string;
  nome: string;
  capacidadeL: number;
  potenciaArQuenteW: number;
  potenciaVaporW: number | null; // null when the model has no steam function
  depositoAguaL: number | null;
  autonomiaVaporMin: number | null;
  receitasAppFabricante: number | null;
  ajuste: AjusteModelo;
  notas?: string; // pt-PT
}
