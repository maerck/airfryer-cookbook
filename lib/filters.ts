import { DIFICULDADE_ORDEM } from "./data";
import type { Categoria, Dificuldade, Metodo, Receita } from "./types";

export type MetodoFiltro = Metodo | "Todos";
export type Ordem = "padrao" | "tempo" | "tempo-desc" | "nome" | "dificuldade";

export interface EstadoFiltroURL {
  q: string;
  metodo: MetodoFiltro;
  cat: Categoria | null;
  dif: Dificuldade | null;
  tempoMax: number | null;
  soFavoritas: boolean;
  ordem: Ordem;
}

export interface EstadoFiltro extends EstadoFiltroURL {
  favoritas: ReadonlySet<number>;
}

export const ESTADO_INICIAL: EstadoFiltroURL = {
  q: "",
  metodo: "Todos",
  cat: null,
  dif: null,
  tempoMax: null,
  soFavoritas: false,
  ordem: "padrao",
};

interface ParamsLike {
  get(name: string): string | null;
}

const METODOS_VALIDOS: readonly string[] = ["Air Fryer", "Vapor", "Vapor + Ar"];
const CATEGORIAS_VALIDAS: readonly string[] = [
  "Carne",
  "Peixe & Marisco",
  "Vegetariano",
  "Acompanhamentos & Lanches",
  "Doces",
];
const DIFICULDADES_VALIDAS: readonly string[] = ["Muito fácil", "Fácil", "Média"];
const ORDENACOES_VALIDAS: readonly string[] = ["tempo", "tempo-desc", "nome", "dificuldade"];
const TEMPO_MAX_LIMITE = 9999;

export function lerEstadoDeParams(params: ParamsLike): EstadoFiltroURL {
  const q = params.get("q") ?? "";
  const metodoRaw = params.get("metodo") ?? "Todos";
  const catRaw = params.get("cat");
  const difRaw = params.get("dif");
  const tmaxRaw = params.get("tmax");
  const tmax = Number(tmaxRaw);
  const ordRaw = params.get("ord") ?? "padrao";
  return {
    q,
    metodo: METODOS_VALIDOS.includes(metodoRaw) ? (metodoRaw as Metodo) : "Todos",
    cat: catRaw && CATEGORIAS_VALIDAS.includes(catRaw) ? (catRaw as Categoria) : null,
    dif: difRaw && DIFICULDADES_VALIDAS.includes(difRaw) ? (difRaw as Dificuldade) : null,
    tempoMax: Number.isInteger(tmax) && tmax > 0 && tmax <= TEMPO_MAX_LIMITE ? tmax : null,
    soFavoritas: params.get("fav") === "1",
    // "1" era o valor antigo de ord (ordenar por tempo) — mantém compatibilidade
    ordem:
      ordRaw === "1" ? "tempo" : ORDENACOES_VALIDAS.includes(ordRaw) ? (ordRaw as Ordem) : "padrao",
  };
}

export function estadoParaParams(estado: EstadoFiltroURL): Record<string, string> {
  const params: Record<string, string> = {};
  if (estado.q.trim() !== "") params.q = estado.q;
  if (estado.metodo !== "Todos") params.metodo = estado.metodo;
  if (estado.cat !== null) params.cat = estado.cat;
  if (estado.dif !== null) params.dif = estado.dif;
  if (estado.tempoMax !== null) params.tmax = String(estado.tempoMax);
  if (estado.soFavoritas) params.fav = "1";
  if (estado.ordem !== "padrao") params.ord = estado.ordem;
  return params;
}

const ACENTOS = new RegExp(`[${String.fromCharCode(0x0300)}-${String.fromCharCode(0x036f)}]`, "g");

export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(ACENTOS, "").toLowerCase();
}

export function correspondePesquisa(receita: Receita, q: string): boolean {
  const termo = normalizar(q.trim());
  if (termo === "") return true;
  if (normalizar(receita.nome).includes(termo)) return true;
  if (normalizar(receita.cat).includes(termo)) return true;
  if (normalizar(receita.metodo).includes(termo)) return true;
  return receita.ingredientes.some((ing) => normalizar(ing).includes(termo));
}

function ordenar(receitas: Receita[], ordem: Ordem): Receita[] {
  const copia = [...receitas];
  switch (ordem) {
    case "tempo":
      return copia.sort((a, b) => a.tempo - b.tempo || a.id - b.id);
    case "tempo-desc":
      return copia.sort((a, b) => b.tempo - a.tempo || a.id - b.id);
    case "nome":
      return copia.sort((a, b) => a.nome.localeCompare(b.nome, "pt-PT") || a.id - b.id);
    case "dificuldade":
      return copia.sort(
        (a, b) =>
          DIFICULDADE_ORDEM[a.dificuldade] - DIFICULDADE_ORDEM[b.dificuldade] ||
          a.tempo - b.tempo ||
          a.id - b.id,
      );
    default:
      return copia;
  }
}

export function filtrarReceitas(receitas: readonly Receita[], estado: EstadoFiltro): Receita[] {
  const filtradas = receitas.filter(
    (r) =>
      (estado.metodo === "Todos" || r.metodo === estado.metodo) &&
      (estado.cat === null || r.cat === estado.cat) &&
      (estado.dif === null || r.dificuldade === estado.dif) &&
      (estado.tempoMax === null || r.tempo <= estado.tempoMax) &&
      (!estado.soFavoritas || estado.favoritas.has(r.id)) &&
      correspondePesquisa(r, estado.q),
  );
  return ordenar(filtradas, estado.ordem);
}
