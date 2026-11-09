import type { Categoria, Dificuldade, Metodo } from "./constants.ts";

// Os valores possíveis vivem em lib/constants.ts (fonte única); aqui só se reexportam os tipos.
export type { Categoria, Dificuldade, Metodo };

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
}

export interface AjusteModelo {
  tempoMin: number; // delta (min) applied to every recipe's tempo
  temperaturaC: number; // delta (°C) applied to every numeric temperature in temp
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
