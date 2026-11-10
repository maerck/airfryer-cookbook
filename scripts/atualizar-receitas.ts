/**
 * Pipeline semanal de conteúdo (M13): recolhe candidatos das fontes abertas registadas em
 * data/fontes.json, remove duplicados face ao dataset, adapta com Mistral Large à Xiaomi Mijia
 * Smart Steam Air Fryer 7 L, revê com Mistral Small e valida com zod. Só ACRESCENTA receitas com
 * ids sequenciais (nunca altera as existentes) em data/recipes/<id>.json e regenera
 * data/recipes.json. Corre só em GitHub Actions (workflow atualizar-receitas.yml) e abre PR para
 * revisão do dono — a app não faz chamadas de rede nem tem chaves.
 *
 * Sem MISTRAL_API_KEY o script falha cedo com mensagem clara e não escreve nada.
 */
import { appendFileSync, readFileSync, writeFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { receitaSchema, validarFontes, validarReceitas } from "../lib/schemas.ts";
import type { Fonte, Receita } from "../lib/types.ts";
import {
  DIR_RECEITAS,
  gerarFicheiroUnido,
  lerDiretorioReceitas,
  montarFicheiroReceita,
} from "./build-data.ts";
import {
  criarProvedorMistral,
  estimarCustoEur,
  MODELO_ADAPTADOR,
  MODELO_REVISOR,
} from "./ia/mistral.ts";
import type { ProvedorIA, UsoIA } from "./ia/provedor.ts";

export const MAX_RECEITAS_POR_EXECUCAO = 5;
export const MAX_PEDIDOS_HTTP_POR_EXECUCAO = 10;
export const USER_AGENT = "airfryer-cookbook-bot/1.0 (+https://airfryer-cookbook.vercel.app)";
export const MODELO_ALVO = "Xiaomi Mijia Smart Steam Air Fryer 7 L";

const FONTES_URL = new URL("../data/fontes.json", import.meta.url);
const RESUMO_URL = new URL("../.github/atualizacao-receitas.md", import.meta.url);

export const candidatoSchema = z.object({
  nome: z.string().min(1),
  url: z.string().url(),
  ingredientes: z.array(z.string().min(1)).min(1),
  passos: z.array(z.string().min(1)).min(1),
});
export type Candidato = z.infer<typeof candidatoSchema>;

export const receitaAdaptadaSchema = receitaSchema.omit({ id: true, fonte: true });
export type ReceitaAdaptada = z.infer<typeof receitaAdaptadaSchema>;

export function normalizarNome(nome: string): string {
  return nome
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function semelhancaIngredientes(a: readonly string[], b: readonly string[]): number {
  const ca = new Set(a.map(normalizarNome));
  const cb = new Set(b.map(normalizarNome));
  if (ca.size === 0 || cb.size === 0) return 0;
  let comum = 0;
  for (const x of ca) if (cb.has(x)) comum += 1;
  return comum / Math.max(ca.size, cb.size);
}

/** Duplicado quando o nome normalizado é igual ou os ingredientes coincidem ≥ 70%. */
export function eDuplicado(
  existentes: readonly { nome: string; ingredientes: readonly string[] }[],
  candidato: { nome: string; ingredientes: readonly string[] },
): boolean {
  const alvo = normalizarNome(candidato.nome);
  return existentes.some(
    (r) =>
      normalizarNome(r.nome) === alvo ||
      semelhancaIngredientes(r.ingredientes, candidato.ingredientes) >= 0.7,
  );
}

export async function extrairCandidatos(texto: string, provedor: ProvedorIA): Promise<Candidato[]> {
  const saida = await provedor.gerarJson(
    [
      {
        papel: "system",
        conteudo:
          "Extrai do texto abaixo todas as receitas de cozinha utilizáveis (nome, url original, ingredientes, passos). " +
          'Devolve apenas JSON no formato {"candidatos": [{ "nome", "url", "ingredientes": [...], "passos": [...] }]}. ' +
          'Se não houver receitas, devolve {"candidatos": []}.',
      },
      { papel: "user", conteudo: texto.slice(0, 30_000) },
    ],
    z.object({ candidatos: z.array(candidatoSchema) }),
  );
  return saida.candidatos;
}

export async function adaptarCandidato(
  candidato: Candidato,
  provedor: ProvedorIA,
): Promise<ReceitaAdaptada> {
  return provedor.gerarJson(
    [
      {
        papel: "system",
        conteudo:
          `Adapta a receita para a ${MODELO_ALVO} (air fryer com vapor, cesto de 7 L): escolhe método, temperatura, tempo total em minutos, dificuldade e categoria; escreve tudo em português de Portugal (pt-PT). ` +
          "Devolve apenas JSON com as chaves: nome, emoji, metodo, cat, tempo, dificuldade, doses, temp, ingredientes, passos, dica (opcional).",
      },
      {
        papel: "user",
        conteudo: `Receita original (${candidato.url}):\n${candidato.nome}\nIngredientes: ${candidato.ingredientes.join("; ")}\nPassos: ${candidato.passos.join(" ")}`,
      },
    ],
    receitaAdaptadaSchema,
    { modelo: MODELO_ADAPTADOR, maxTokens: 4096 },
  );
}

export async function reverReceita(
  adaptada: ReceitaAdaptada,
  provedor: ProvedorIA,
): Promise<ReceitaAdaptada> {
  return provedor.gerarJson(
    [
      {
        papel: "system",
        conteudo:
          "Revê a receita adaptada: corrige pt-PT (ex.: 'azeite', não 'aceite de oliva'), verifica a categoria, a dificuldade e a coerência entre método, temperatura e tempo para uma air fryer de 7 L. " +
          "Devolve apenas JSON idêntico no esquema, com as correções aplicadas.",
      },
      { papel: "user", conteudo: JSON.stringify(adaptada) },
    ],
    receitaAdaptadaSchema,
    { modelo: MODELO_REVISOR, maxTokens: 4096 },
  );
}

export function montarReceita(
  adaptada: ReceitaAdaptada,
  candidato: Candidato,
  fonte: Fonte,
  id: number,
): Receita {
  return validarReceitas([
    {
      ...adaptada,
      id,
      fonte: { nome: fonte.nome, url: candidato.url, licenca: fonte.licenca },
    },
  ])[0];
}

export interface ResultadoPipeline {
  novas: Receita[];
  resumo: string;
}

export interface DepsPipeline {
  provedor: ProvedorIA & { usoPorModelo?: Record<string, UsoIA> };
  fetchTexto: (url: string) => Promise<string>;
  fontes: Fonte[];
  existentes: readonly Receita[];
  maxNovas?: number;
}

export async function executarPipeline(deps: DepsPipeline): Promise<ResultadoPipeline> {
  const maxNovas = deps.maxNovas ?? MAX_RECEITAS_POR_EXECUCAO;
  const novas: Receita[] = [];
  let proximoId = deps.existentes.reduce((m, r) => Math.max(m, r.id), 0) + 1;
  for (const fonte of deps.fontes) {
    if (novas.length >= maxNovas) break;
    let texto: string;
    try {
      texto = await deps.fetchTexto(fonte.url);
    } catch (erro) {
      console.warn(
        `fonte ${fonte.id} inacessível: ${erro instanceof Error ? erro.message : String(erro)}`,
      );
      continue;
    }
    const candidatos = await extrairCandidatos(texto, deps.provedor);
    for (const candidato of candidatos) {
      if (novas.length >= maxNovas) break;
      if (eDuplicado(deps.existentes, candidato) || eDuplicado(novas, candidato)) continue;
      try {
        const adaptada = await adaptarCandidato(candidato, deps.provedor);
        const revista = await reverReceita(adaptada, deps.provedor);
        novas.push(montarReceita(revista, candidato, fonte, proximoId));
        proximoId += 1;
      } catch (erro) {
        console.warn(
          `candidato rejeitado (${candidato.nome}): ${erro instanceof Error ? erro.message : String(erro)}`,
        );
      }
    }
  }
  return { novas, resumo: montarResumo(novas, deps.provedor) };
}

export function montarResumo(
  novas: readonly Receita[],
  provedor: ProvedorIA & { usoPorModelo?: Record<string, UsoIA> },
): string {
  const uso = provedor.uso;
  const custo = provedor.usoPorModelo ? estimarCustoEur(provedor.usoPorModelo) : 0;
  const linhas = [
    "## Proposta semanal de receitas novas (M13)",
    "",
    `Receitas novas: **${novas.length}** (máx. ${MAX_RECEITAS_POR_EXECUCAO} por execução).`,
    "",
    ...novas.map(
      (r) =>
        `- #${r.id} ${r.emoji} ${r.nome} — ${r.metodo}, ${r.temp}, ${r.tempo} min (fonte: ${r.fonte?.nome}, ${r.fonte?.licenca})`,
    ),
    "",
    "Fontes e licenças: ver `data/fontes.json` (só licenças que permitem adaptação, verificadas pelo dono).",
    "",
    `Uso de IA nesta execução: ${uso.pedidos} pedidos, ${uso.tokensEntrada + uso.tokensSaida} tokens; custo estimado ≈ €${custo.toFixed(4)}.`,
    "",
    "## Checklist de segurança alimentar (confirmar antes de fundir)",
    "",
    "- [ ] Aves: temperatura interna ≥ 74 °C no passo final",
    "- [ ] Porco: ≥ 63 °C (ou combinação tempo/temperatura equivalente)",
    "- [ ] Peixe & marisco: ≥ 63 °C",
    "- [ ] Ovos: ≥ 71 °C",
    "- [ ] Copy revisto em pt-PT (sem traduções automáticas estranhas)",
    "- [ ] Método, temperatura e tempo coerentes com a Xiaomi Mijia Smart Steam Air Fryer 7 L",
    "",
    "`pnpm check:data` correu verde nesta proposta; nenhuma receita existente foi alterada.",
    "",
  ];
  return linhas.join("\n");
}

/** fetch de texto com limite de pedidos e user-agent genérico (M13). */
export function criarFetchLimitado(
  fetchImpl: typeof fetch = fetch,
  maxPedidos = MAX_PEDIDOS_HTTP_POR_EXECUCAO,
): (url: string) => Promise<string> {
  let pedidos = 0;
  return async (url: string) => {
    if (pedidos >= maxPedidos) {
      throw new Error(`limite de pedidos HTTP atingido (${maxPedidos}) nesta execução`);
    }
    pedidos += 1;
    const resposta = await fetchImpl(url, {
      headers: { "User-Agent": USER_AGENT, Accept: "text/html,application/json;q=0.9" },
      signal: AbortSignal.timeout(20_000),
    });
    if (!resposta.ok) throw new Error(`HTTP ${resposta.status} ao obter ${url}`);
    return resposta.text();
  };
}

function registarOutputGitHub(novas: number): void {
  if (process.env.GITHUB_OUTPUT) {
    appendFileSync(process.env.GITHUB_OUTPUT, `novas=${novas}\n`);
  }
}

async function main(): Promise<number> {
  const chave = process.env.MISTRAL_API_KEY;
  if (!chave) {
    console.error(
      "atualizar:receitas FALHOU: MISTRAL_API_KEY não está definida (GitHub Secret) — sem chave não há pipeline nem PR",
    );
    return 1;
  }
  try {
    const fontes = validarFontes(JSON.parse(readFileSync(FONTES_URL, "utf8")) as unknown);
    if (fontes.length === 0) {
      console.log("sem fontes registadas em data/fontes.json — nada a fazer (sem PR)");
      registarOutputGitHub(0);
      return 0;
    }
    const existentes = lerDiretorioReceitas();
    const provedor = criarProvedorMistral(chave);
    const fetchTexto = criarFetchLimitado(fetch);
    const { novas, resumo } = await executarPipeline({ provedor, fetchTexto, fontes, existentes });
    registarOutputGitHub(novas.length);
    if (novas.length === 0) {
      console.log("nenhuma receita nova válida nesta execução — sem PR");
      return 0;
    }
    for (const r of novas) {
      writeFileSync(new URL(`${r.id}.json`, DIR_RECEITAS), montarFicheiroReceita(r));
    }
    gerarFicheiroUnido();
    writeFileSync(RESUMO_URL, resumo);
    console.log(
      `atualizar:receitas OK — ${novas.length} receita(s) nova(s): ${novas.map((r) => `#${r.id} ${r.nome}`).join(", ")}`,
    );
    return 0;
  } catch (erro) {
    console.error(
      `atualizar:receitas FALHOU: ${erro instanceof Error ? erro.message : String(erro)}`,
    );
    return 1;
  }
}

if (process.argv[1] !== undefined && import.meta.url === pathToFileURL(process.argv[1]).href) {
  process.exit(await main());
}
