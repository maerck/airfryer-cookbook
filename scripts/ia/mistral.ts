/**
 * Implementação Mistral da fronteira ProvedorIA (M13): endpoint UE, modelos fixados em
 * constantes, sem SDK — apenas fetch. A chave nunca sai deste processo (CI: GitHub Secrets).
 */
import type { ZodType } from "zod";
import { type ProvedorIA, USO_ZERO, type UsoIA, verificarLimites } from "./provedor.ts";

export const ENDPOINT_MISTRAL = "https://api.mistral.ai/v1/chat/completions";
/** Versões de modelo fixadas (único sítio para mudar). */
export const MODELO_ADAPTADOR = "mistral-large-latest";
export const MODELO_REVISOR = "mistral-small-latest";

/** Estimativa de preços (EUR por 1M tokens) só para o custo estimado no corpo do PR. */
export const PRECO_EUR_POR_1M_TOKENS: Record<string, { entrada: number; saida: number }> = {
  [MODELO_ADAPTADOR]: { entrada: 2, saida: 6 },
  [MODELO_REVISOR]: { entrada: 0.2, saida: 0.6 },
};

/** Custo estimado em EUR a partir do uso agregado por modelo. */
export function estimarCustoEur(usoPorModelo: Record<string, UsoIA>): number {
  let total = 0;
  for (const [modelo, uso] of Object.entries(usoPorModelo)) {
    const preco = PRECO_EUR_POR_1M_TOKENS[modelo] ?? { entrada: 0, saida: 0 };
    total += (uso.tokensEntrada * preco.entrada + uso.tokensSaida * preco.saida) / 1_000_000;
  }
  return total;
}

type FetchLike = typeof fetch;

interface RespostaMistral {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
}

export function criarProvedorMistral(
  chaveApi: string,
  fetchImpl: FetchLike = fetch,
): ProvedorIA & {
  usoPorModelo: Record<string, UsoIA>;
} {
  let uso: UsoIA = { ...USO_ZERO };
  const usoPorModelo: Record<string, UsoIA> = {};
  return {
    nome: "mistral",
    usoPorModelo,
    get uso() {
      return { ...uso };
    },
    async gerarJson<Saida>(
      mensagens: { papel: "system" | "user"; conteudo: string }[],
      schema: ZodType<Saida>,
      opcoes?: { modelo?: string; maxTokens?: number },
    ): Promise<Saida> {
      verificarLimites(uso);
      const modelo = opcoes?.modelo ?? MODELO_ADAPTADOR;
      const resposta = await fetchImpl(ENDPOINT_MISTRAL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${chaveApi}`,
        },
        body: JSON.stringify({
          model: modelo,
          messages: mensagens,
          response_format: { type: "json_object" },
          temperature: 0.2,
          max_tokens: opcoes?.maxTokens ?? 4096,
        }),
      });
      if (!resposta.ok) {
        throw new Error(`Mistral devolveu HTTP ${resposta.status}: ${await resposta.text()}`);
      }
      const corpo = (await resposta.json()) as RespostaMistral;
      const delta: UsoIA = {
        pedidos: 1,
        tokensEntrada: corpo.usage?.prompt_tokens ?? 0,
        tokensSaida: corpo.usage?.completion_tokens ?? 0,
      };
      uso = {
        pedidos: uso.pedidos + delta.pedidos,
        tokensEntrada: uso.tokensEntrada + delta.tokensEntrada,
        tokensSaida: uso.tokensSaida + delta.tokensSaida,
      };
      const porModelo = usoPorModelo[modelo] ?? { ...USO_ZERO };
      usoPorModelo[modelo] = {
        pedidos: porModelo.pedidos + delta.pedidos,
        tokensEntrada: porModelo.tokensEntrada + delta.tokensEntrada,
        tokensSaida: porModelo.tokensSaida + delta.tokensSaida,
      };
      verificarLimites(uso);
      const conteudo = corpo.choices?.[0]?.message?.content;
      if (!conteudo) throw new Error("Mistral devolveu uma resposta sem conteúdo");
      let bruto: unknown;
      try {
        bruto = JSON.parse(conteudo);
      } catch {
        throw new Error("Mistral devolveu conteúdo que não é JSON válido");
      }
      const parsed = schema.safeParse(bruto);
      if (!parsed.success) {
        throw new Error(`saída do modelo inválida segundo o schema: ${parsed.error.message}`);
      }
      return parsed.data;
    },
  };
}
