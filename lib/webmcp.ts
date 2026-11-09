import { CATEGORIAS, DIFICULDADES, METODOS, ORDENS } from "./constants";
import {
  contarPorCategoria,
  contarPorMetodo,
  RECEITAS,
  receitaPorId,
  TOTAL_RECEITAS,
} from "./data";
import { type EstadoFiltro, filtrarReceitas, type MetodoFiltro, pertence } from "./filters";
import { normalizarTenho, sugerirReceitas } from "./suggest";
import type { Receita } from "./types";

/**
 * WebMCP — expõe ferramentas só de leitura sobre as receitas a agentes de IA no navegador.
 * A API vive em `document.modelContext` (spec atual; `navigator.modelContext` é a localização
 * legada) e é fornecida nativamente pelo navegador ou pelo polyfill oficial.
 * Sem backend: tudo corre no cliente sobre o dataset local. Tipos mínimos da API, sem
 * dependência externa; se o navegador não tiver WebMCP, o registo é um no-op.
 */

export interface WebMCPContent {
  type: "text";
  text: string;
}
export interface WebMCPResult {
  content: WebMCPContent[];
  isError?: boolean;
}
export interface WebMCPToolDef {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations: { readOnlyHint: boolean; destructiveHint: boolean; openWorldHint: boolean };
  execute: (args: Record<string, unknown>) => Promise<WebMCPResult>;
}
export interface ModelContextLike {
  registerTool: (tool: WebMCPToolDef) => unknown;
  unregisterTool?: (name: string) => void;
}

function resolverModelContext(): ModelContextLike | undefined {
  // spec atual: document.modelContext; legado: navigator.modelContext
  if (typeof document !== "undefined") {
    const mc = (document as Document & { modelContext?: ModelContextLike }).modelContext;
    if (mc && typeof mc.registerTool === "function") return mc;
  }
  if (typeof navigator !== "undefined") {
    const mc = (navigator as Navigator & { modelContext?: ModelContextLike }).modelContext;
    if (mc && typeof mc.registerTool === "function") return mc;
  }
  return undefined;
}

const MAX_RESULTADOS_BUSCA = 25;
const MAX_SUGESTOES = 10;

function texto(obj: unknown): WebMCPResult {
  return { content: [{ type: "text", text: JSON.stringify(obj, null, 2) }] };
}

function erro(mensagem: string): WebMCPResult {
  return { content: [{ type: "text", text: mensagem }], isError: true };
}

function comoTexto(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function comoInteiro(v: unknown): number | null {
  return typeof v === "number" && Number.isInteger(v) ? v : null;
}

function resumoReceita(r: Receita) {
  return {
    id: r.id,
    nome: r.nome,
    emoji: r.emoji,
    metodo: r.metodo,
    cat: r.cat,
    tempo: r.tempo,
    dificuldade: r.dificuldade,
    doses: r.doses,
    temp: r.temp,
    ingredientes: r.ingredientes,
  };
}

function searchRecipes(args: Record<string, unknown>): WebMCPResult {
  const q = comoTexto(args.q);
  const metodoRaw = comoTexto(args.metodo) || "Todos";
  const metodo: MetodoFiltro = pertence(METODOS, metodoRaw) ? metodoRaw : "Todos";
  const catRaw = comoTexto(args.cat);
  const cat = pertence(CATEGORIAS, catRaw) ? catRaw : null;
  const difRaw = comoTexto(args.dificuldade);
  const dif = pertence(DIFICULDADES, difRaw) ? difRaw : null;
  const tempoMax = comoInteiro(args.tempoMax);
  if (tempoMax !== null && tempoMax <= 0) return erro("tempoMax tem de ser um inteiro positivo.");
  const ordemRaw = comoTexto(args.ordem) || "padrao";
  const ordem = pertence(ORDENS, ordemRaw) ? ordemRaw : "padrao";

  const estado: EstadoFiltro = {
    q,
    metodo,
    cat,
    dif,
    tempoMax,
    soFavoritas: false,
    ordem,
    favoritas: new Set(),
  };
  const resultado = filtrarReceitas(RECEITAS, estado);
  const compacto = resultado.slice(0, MAX_RESULTADOS_BUSCA).map(resumoReceita);
  return texto({
    total: resultado.length,
    mostradas: compacto.length,
    ...(resultado.length > compacto.length
      ? {
          nota: `Só as primeiras ${compacto.length}; usa get_recipe com o id para a receita completa.`,
        }
      : {}),
    receitas: compacto,
  });
}

function getRecipe(args: Record<string, unknown>): WebMCPResult {
  const id = comoInteiro(args.id);
  if (id === null || id < 1) return erro("id tem de ser um inteiro positivo.");
  const r = receitaPorId(id);
  if (!r) return erro(`Receita ${id} não encontrada (ids 1..${TOTAL_RECEITAS}).`);
  return texto({ ...resumoReceita(r), passos: r.passos, ...(r.dica ? { dica: r.dica } : {}) });
}

function suggestRecipes(args: Record<string, unknown>): WebMCPResult {
  const lista = Array.isArray(args.ingredientes)
    ? args.ingredientes.filter((x) => typeof x === "string")
    : [];
  if (lista.length === 0) return erro("ingredientes tem de ser um array de strings não vazio.");
  const sugestoes = sugerirReceitas(RECEITAS, normalizarTenho(lista)).slice(0, MAX_SUGESTOES);
  return texto({
    total: TOTAL_RECEITAS,
    sugestoes: sugestoes.map((s) => ({
      id: s.receita.id,
      nome: s.receita.nome,
      emoji: s.receita.emoji,
      metodo: s.receita.metodo,
      cat: s.receita.cat,
      tempo: s.receita.tempo,
      cobertos: s.cobertos,
      totalIngredientes: s.total,
    })),
  });
}

function listFilters(): WebMCPResult {
  return texto({
    totalReceitas: TOTAL_RECEITAS,
    metodos: Object.fromEntries(Object.entries(contarPorMetodo())),
    categorias: Object.fromEntries(Object.entries(contarPorCategoria())),
    dificuldades: DIFICULDADES,
    exemplo: "search_recipes({ q: 'frango', metodo: 'Air Fryer', tempoMax: 30 })",
  });
}

/** Executa uma ferramenta pelo nome — puro, testável. */
export function executarFerramenta(nome: string, args: Record<string, unknown>): WebMCPResult {
  switch (nome) {
    case "search_recipes":
      return searchRecipes(args);
    case "get_recipe":
      return getRecipe(args);
    case "suggest_recipes":
      return suggestRecipes(args);
    case "list_filters":
      return listFilters();
    default:
      return erro(`Ferramenta desconhecida: ${nome}`);
  }
}

const ANNOTATIONS = { readOnlyHint: true, destructiveHint: false, openWorldHint: false } as const;

export const FERRAMENTAS_WEBMCP: WebMCPToolDef[] = [
  {
    name: "search_recipes",
    description:
      "Procura receitas do livro (air fryer + vapor) por texto livre e/ou filtros. Devolve no máximo 25 resultados com id, nome, método, categoria, tempo, dificuldade, doses, temperatura e ingredientes. Usa get_recipe para os passos completos.",
    inputSchema: {
      type: "object",
      properties: {
        q: { type: "string", description: "Texto livre (nome, ingrediente, categoria ou método)." },
        metodo: { type: "string", enum: ["Todos", ...METODOS] },
        cat: { type: "string", enum: [...CATEGORIAS] },
        dificuldade: { type: "string", enum: [...DIFICULDADES] },
        tempoMax: { type: "integer", minimum: 1, description: "Tempo máximo em minutos." },
        ordem: { type: "string", enum: [...ORDENS] },
      },
    },
    annotations: ANNOTATIONS,
    execute: async (args) => executarFerramenta("search_recipes", args),
  },
  {
    name: "get_recipe",
    description: "Devolve a receita completa (ingredientes, passos e dica) pelo id numérico.",
    inputSchema: {
      type: "object",
      properties: { id: { type: "integer", minimum: 1 } },
      required: ["id"],
    },
    annotations: ANNOTATIONS,
    execute: async (args) => executarFerramenta("get_recipe", args),
  },
  {
    name: "suggest_recipes",
    description:
      "Sugere receitas ordenadas pela cobertura dos ingredientes que o utilizador tem em casa (matching por palavras, insensível a acentos).",
    inputSchema: {
      type: "object",
      properties: {
        ingredientes: {
          type: "array",
          items: { type: "string" },
          description: "Ingredientes disponíveis.",
        },
      },
      required: ["ingredientes"],
    },
    annotations: ANNOTATIONS,
    execute: async (args) => executarFerramenta("suggest_recipes", args),
  },
  {
    name: "list_filters",
    description:
      "Lista os valores de filtro disponíveis (métodos, categorias, dificuldades) com as contagens atuais do dataset.",
    inputSchema: { type: "object", properties: {} },
    annotations: ANNOTATIONS,
    execute: async () => executarFerramenta("list_filters", {}),
  },
];

/**
 * Regista as ferramentas no modelContext do documento (WebMCP: `document.modelContext`,
 * com `navigator.modelContext` como fallback legado). Devolve a função de unregister.
 * No-op seguro quando o navegador não suporta WebMCP.
 */
const CHAVE_REGISTO = "__webmcpFerramentasRegistadas";

/** Nomes já registados neste documento — guardados em globalThis para sobreviver a remounts (StrictMode) e HMR. */
function nomesRegistados(): Set<string> {
  const g = globalThis as Record<string, unknown>;
  if (!(g[CHAVE_REGISTO] instanceof Set)) g[CHAVE_REGISTO] = new Set<string>();
  return g[CHAVE_REGISTO] as Set<string>;
}

export function registrarFerramentasWebMCP(modelContext?: ModelContextLike): () => void {
  const alvo = modelContext ?? resolverModelContext();
  if (!alvo || typeof alvo.registerTool !== "function") return () => {};
  const registados = nomesRegistados();
  const unregistadores = new Map<string, () => void>();
  const novas: string[] = [];
  const guardarUnregister = (nome: string, devolvido: unknown) => {
    if (typeof devolvido === "function") {
      unregistadores.set(nome, devolvido as () => void);
    } else if (typeof alvo.unregisterTool === "function") {
      const unregisterTool = alvo.unregisterTool.bind(alvo);
      unregistadores.set(nome, () => unregisterTool(nome));
    }
  };
  const registar = (ferramenta: WebMCPToolDef) => {
    if (registados.has(ferramenta.name)) return; // remount/HMR não duplica (o navegador rejeita nomes duplicados)
    try {
      const r = alvo.registerTool(ferramenta);
      registados.add(ferramenta.name);
      novas.push(ferramenta.name);
      if (r && typeof (r as Promise<unknown>).then === "function") {
        // registerTool assíncrono: unregister chega quando a promise resolve
        (r as Promise<unknown>).then(
          (unreg) => guardarUnregister(ferramenta.name, unreg),
          (erro) => {
            registados.delete(ferramenta.name);
            console.error(`[webmcp] registerTool falhou para "${ferramenta.name}":`, erro);
          },
        );
      } else {
        guardarUnregister(ferramenta.name, r);
      }
    } catch (erro) {
      console.error(`[webmcp] registerTool falhou para "${ferramenta.name}":`, erro);
    }
  };
  for (const ferramenta of FERRAMENTAS_WEBMCP) registar(ferramenta);
  if (novas.length > 0) console.info(`[webmcp] ferramentas registadas: ${novas.join(", ")}`);
  return () => {
    // Só sai do dedupe o que foi mesmo removido do navegador: assim um remount (StrictMode)
    // volta a registar, e o que não pôde ser removido não é registado em duplicado.
    for (const [nome, unregister] of unregistadores) {
      unregister();
      registados.delete(nome);
    }
    unregistadores.clear();
  };
}
