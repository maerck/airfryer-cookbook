import modelosJson from "@/data/modelos.json";
import { validarModelos } from "./schemas";
import type { AjusteModelo, ModeloAirfryer, Receita } from "./types";

export const MODELOS: readonly ModeloAirfryer[] = validarModelos(modelosJson);

/** First entry is the default — used for SSR and before localStorage hydrates. */
export const MODELO_PADRAO: ModeloAirfryer = MODELOS[0];

export function encontrarModelo(id: string | null | undefined): ModeloAirfryer {
  return MODELOS.find((m) => m.id === id) ?? MODELO_PADRAO;
}

export function temAjuste(modelo: ModeloAirfryer): boolean {
  return modelo.ajuste.tempoMin !== 0 || modelo.ajuste.temperaturaC !== 0;
}

/** Shift every numeric "°C" in a temp string (e.g. "Vapor → 200°C"); non-numeric strings ("Modo vapor") pass through. */
export function ajustarTemperatura(temp: string, deltaC: number): string {
  if (deltaC === 0) return temp;
  let algum = false;
  const resultado = temp.replace(/(\d+)\s*°\s*C/gi, (_trecho, n: string) => {
    algum = true;
    const novo = Math.max(0, Number.parseInt(n, 10) + deltaC);
    return `${novo}°C`;
  });
  return algum ? resultado : temp;
}

export interface ReceitaAjustada {
  tempo: number; // minutes, clamped to >= 1
  temp: string;
}

export function aplicarAjusteModelo(receita: Receita, modelo: ModeloAirfryer): ReceitaAjustada {
  return {
    tempo: Math.max(1, receita.tempo + modelo.ajuste.tempoMin),
    temp: ajustarTemperatura(receita.temp, modelo.ajuste.temperaturaC),
  };
}

export function ajusteDescricao(ajuste: AjusteModelo): string {
  if (ajuste.tempoMin === 0 && ajuste.temperaturaC === 0) return "Sem ajuste";
  const partes: string[] = [];
  if (ajuste.tempoMin !== 0) partes.push(`${ajuste.tempoMin > 0 ? "+" : ""}${ajuste.tempoMin} min`);
  if (ajuste.temperaturaC !== 0) {
    partes.push(`${ajuste.temperaturaC > 0 ? "+" : ""}${ajuste.temperaturaC} °C`);
  }
  return partes.join(", ");
}

/** pt-PT number formatting for UI copy (e.g. 1.5 → "1,5"). */
export function formatarNumero(n: number): string {
  return n.toLocaleString("pt-PT");
}
