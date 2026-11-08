import type { Receita } from "./types";

export interface ItemLista {
  receitaId: number;
  receitaNome: string;
  receitaEmoji: string;
  indice: number; // índice do ingrediente dentro da receita
  ingrediente: string;
}

/**
 * Agrega os ingredientes marcados (checkbox) de todas as receitas numa única lista de
 * compras, agrupada por receita e ordenada por id de receita e índice do ingrediente.
 */
export function agregarListaCompras(
  receitas: readonly Receita[],
  marcados: Record<number, number[]>,
): ItemLista[] {
  const porId = new Map(receitas.map((r) => [r.id, r]));
  const itens: ItemLista[] = [];
  for (const [idRaw, indices] of Object.entries(marcados)) {
    const receita = porId.get(Number(idRaw));
    if (!receita) continue;
    for (const indice of indices) {
      const ingrediente = receita.ingredientes[indice];
      if (typeof ingrediente !== "string") continue;
      itens.push({
        receitaId: receita.id,
        receitaNome: receita.nome,
        receitaEmoji: receita.emoji,
        indice,
        ingrediente,
      });
    }
  }
  return itens.sort((a, b) => a.receitaId - b.receitaId || a.indice - b.indice);
}

export function contarListaCompras(marcados: Record<number, number[]>): number {
  return Object.values(marcados).reduce((soma, lista) => soma + lista.length, 0);
}

/** Lista de compras em texto simples (para copiar/colar), agrupada por receita. */
export function textoListaCompras(itens: readonly ItemLista[]): string {
  const linhas: string[] = ["🛒 Lista de compras"];
  let receitaAtual = -1;
  for (const item of itens) {
    if (item.receitaId !== receitaAtual) {
      receitaAtual = item.receitaId;
      linhas.push("", `${item.receitaEmoji} ${item.receitaNome}`);
    }
    linhas.push(`- ${item.ingrediente}`);
  }
  return linhas.join("\n");
}
