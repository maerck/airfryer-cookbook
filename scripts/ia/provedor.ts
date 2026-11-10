/**
 * Fronteira de fornecedor de IA (M13, princípio 9): o pipeline de conteúdo em
 * scripts/atualizar-receitas.ts fala apenas com esta interface; a única implementação é o
 * Mistral via fetch em scripts/ia/mistral.ts. Sem SDK no código da app — a app não faz
 * chamadas de rede nem tem chaves.
 */
import type { ZodType } from "zod";

export interface UsoIA {
  pedidos: number;
  tokensEntrada: number;
  tokensSaida: number;
}

export const USO_ZERO: UsoIA = { pedidos: 0, tokensEntrada: 0, tokensSaida: 0 };

/** Limites de custo por execução do pipeline (M13). */
export const LIMITE_PEDIDOS_POR_EXECUCAO = 40;
export const LIMITE_TOKENS_POR_EXECUCAO = 200_000;

export function verificarLimites(uso: UsoIA): void {
  if (uso.pedidos > LIMITE_PEDIDOS_POR_EXECUCAO) {
    throw new Error(
      `limite de custo excedido: ${uso.pedidos} pedidos > ${LIMITE_PEDIDOS_POR_EXECUCAO} por execução`,
    );
  }
  const total = uso.tokensEntrada + uso.tokensSaida;
  if (total > LIMITE_TOKENS_POR_EXECUCAO) {
    throw new Error(
      `limite de custo excedido: ${total} tokens > ${LIMITE_TOKENS_POR_EXECUCAO} por execução`,
    );
  }
}

export interface ProvedorIA {
  readonly nome: string;
  readonly uso: UsoIA;
  /**
   * Pede ao modelo uma resposta em JSON e valida-a com o schema zod (a saída do LLM é sempre
   * uma fronteira de confiança). Devolve o objeto já validado; lança erro se a resposta não
   * for JSON válido ou não passar no schema.
   */
  gerarJson<Saida>(
    mensagens: { papel: "system" | "user"; conteudo: string }[],
    schema: ZodType<Saida>,
    opcoes?: { modelo?: string; maxTokens?: number },
  ): Promise<Saida>;
}
