import { z } from "zod";
// extensão .ts explícita: este módulo também é carregado diretamente pelo Node (scripts/check-data.ts)
import { CATEGORIAS, DIFICULDADES, METODOS } from "./constants.ts";
import type { Fonte, ModeloAirfryer, Receita } from "./types";

/**
 * Licenças de conteúdo aberto que permitem adaptação com atribuição (M13). O registo em
 * data/fontes.json só aceita estas licenças; a verificação da licença e do robots.txt de cada
 * fonte é feita manualmente pelo dono antes de a registar.
 */
export const LICENCAS_PERMITIDAS = ["CC0 1.0", "CC BY 4.0", "CC BY-SA 4.0"] as const;
export const licencaPermitidaSchema = z.enum(LICENCAS_PERMITIDAS);

export const metodoSchema = z.enum(METODOS);
export const categoriaSchema = z.enum(CATEGORIAS);
export const dificuldadeSchema = z.enum(DIFICULDADES);

export const atribuicaoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url(),
  licenca: z.string().min(1),
  autores: z.array(z.string().min(1)).min(1).optional(),
});

export const receitaSchema = z.object({
  id: z.number().int().positive(),
  nome: z.string().min(1),
  emoji: z.string().min(1),
  metodo: metodoSchema,
  cat: categoriaSchema,
  tempo: z.number().int().positive(),
  dificuldade: dificuldadeSchema,
  doses: z.number().int().positive(),
  temp: z.string().min(1),
  ingredientes: z.array(z.string().min(1)).min(1),
  passos: z.array(z.string().min(1)).min(1),
  dica: z.string().min(1).optional(),
  fonte: atribuicaoSchema.optional(),
});

export const fonteSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  nome: z.string().min(1),
  url: z.string().url(),
  licenca: licencaPermitidaSchema,
  termosAtribuicao: z.string().min(1).optional(),
});

export const ajusteDeltaSchema = z.object({
  tempoMin: z.number().int(),
  temperaturaC: z.number().int(),
});

export const ajusteSchema = z.object({
  tempoMin: z.number().int(),
  temperaturaC: z.number().int(),
  porMetodo: z.partialRecord(metodoSchema, ajusteDeltaSchema).optional(),
});

export const modeloSchema = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  marca: z.string().min(1),
  nome: z.string().min(1),
  capacidadeL: z.number().positive(),
  potenciaArQuenteW: z.number().int().positive(),
  potenciaVaporW: z.number().int().positive().nullable(),
  depositoAguaL: z.number().positive().nullable(),
  autonomiaVaporMin: z.number().int().positive().nullable(),
  receitasAppFabricante: z.number().int().positive().nullable(),
  ajuste: ajusteSchema,
  notas: z.string().min(1).optional(),
});

function rejeitarIdsDuplicados<T extends { id: number | string }>(
  dados: T[],
  ficheiro: string,
): T[] {
  const ids = new Set<number | string>();
  for (const item of dados) {
    if (ids.has(item.id)) {
      throw new Error(`${ficheiro} inválido: id duplicado ${JSON.stringify(item.id)}`);
    }
    ids.add(item.id);
  }
  return dados;
}

/**
 * Valida o dataset de receitas. O dataset pode crescer além das 200 receitas iniciais:
 * basta ids únicos, inteiros e positivos.
 */
export function validarReceitas(dados: unknown, ficheiro = "data/recipes.json"): Receita[] {
  const parsed = z.array(receitaSchema).min(1).safeParse(dados);
  if (!parsed.success) {
    throw new Error(`${ficheiro} inválido: ${parsed.error.message}`);
  }
  return rejeitarIdsDuplicados(parsed.data, ficheiro);
}

/** Valida o dataset de modelos de airfryer (ids slug únicos). */
export function validarModelos(dados: unknown, ficheiro = "data/modelos.json"): ModeloAirfryer[] {
  const parsed = z.array(modeloSchema).min(1).safeParse(dados);
  if (!parsed.success) {
    throw new Error(`${ficheiro} inválido: ${parsed.error.message}`);
  }
  return rejeitarIdsDuplicados(parsed.data, ficheiro);
}

/**
 * Valida o registo de fontes abertas (M13). Pode estar vazio ([]) — o dono regista fontes só
 * depois de verificar manualmente a licença e o robots.txt de cada uma.
 */
export function validarFontes(dados: unknown, ficheiro = "data/fontes.json"): Fonte[] {
  const parsed = z.array(fonteSchema).safeParse(dados);
  if (!parsed.success) {
    throw new Error(`${ficheiro} inválido: ${parsed.error.message}`);
  }
  return rejeitarIdsDuplicados(parsed.data, ficheiro);
}
