import { normalizar } from "./filters";
import type { Receita } from "./types";

export interface Sugestao {
  receita: Receita;
  cobertos: number; // ingredientes da receita que o utilizador tem
  total: number; // total de ingredientes da receita
  rácio: number; // cobertos / total (0..1)
}

/** Conjunto normalizado de ingredientes que o utilizador tem em casa. */
export type TenhoEmCasa = ReadonlySet<string>;

export function normalizarTenho(lista: readonly string[]): TenhoEmCasa {
  return new Set(lista.map((x) => normalizar(x.trim())).filter((x) => x !== ""));
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Verdadeiro se `termo` ocorre em `texto` como palavra(s) completa(s) — limites Unicode,
 * para "sal" não casar com "salmão" mas "frango" casar com "1 frango pequeno".
 */
export function contemTermo(texto: string, termo: string): boolean {
  if (termo === "") return false;
  const re = new RegExp(`(?<![\\p{L}\\p{N}_])${escapeRegex(termo)}(?![\\p{L}\\p{N}_])`, "iu");
  return re.test(texto);
}

/**
 * Singulariza (aproximadamente) cada palavra de um texto já normalizado, para o plural não
 * impedir o match: "ovos" → "ovo", "limoes" → "limao", "colheres" → "colher".
 */
export function singularizar(texto: string): string {
  return texto.replace(/\p{L}{4,}/gu, (p) => {
    if (p.endsWith("oes") || p.endsWith("aes")) return `${p.slice(0, -3)}ao`;
    if (p.endsWith("ns")) return `${p.slice(0, -2)}m`;
    if (/[rz]es$/.test(p)) return p.slice(0, -2);
    if (p.endsWith("s")) return p.slice(0, -1);
    return p;
  });
}

/** Fragmentos que descrevem o ingrediente anterior em vez de serem um ingrediente. */
const DESCRITOR =
  /^(?:muito\s+)?(?:bem\s+)?(?:sem\s|usa\s|temperad|\S+(?:ad|id)[oa]s?$|limp[oa]s?$|sec[oa]s?$)/u;
const FRAGMENTOS_IGNORADOS: ReadonlySet<string> = new Set(["raspa", "sumo", "palitos"]);
const SEPARADOR = /\s\+\s|,\s+|\s+e\s+/;

function semParentesesNemRotulo(texto: string): string {
  return texto
    .replace(/\([^)]*\)/g, " ")
    .replace(/^[^:]{1,25}:\s*/, "")
    .trim();
}

function eIngrediente(fragmentoNormalizado: string): boolean {
  return (
    fragmentoNormalizado !== "" &&
    !FRAGMENTOS_IGNORADOS.has(fragmentoNormalizado) &&
    !DESCRITOR.test(fragmentoNormalizado)
  );
}

/**
 * Decompõe uma linha de ingredientes nos seus componentes: "Sal, pimenta e tomilho fresco" são
 * três ingredientes e todos têm de estar em casa. Cada componente é uma lista de alternativas
 * ("coentros ou salsa"). Parênteses, rótulos ("Molho: …") e descritores ("… e desfiado") saem.
 * Devolve texto normalizado (sem acentos, minúsculas).
 */
export function componentesIngrediente(ingrediente: string): string[][] {
  const limpo = semParentesesNemRotulo(normalizar(ingrediente));
  const componentes = limpo
    .split(SEPARADOR)
    .map((f) => f.replace(/[\s—–-]+$/u, "").trim())
    .filter(eIngrediente)
    .map((f) =>
      f
        .split(/\s+ou\s+/)
        .map((alt) => alt.trim())
        .filter((alt) => alt !== ""),
    )
    .filter((alts) => alts.length > 0);
  return componentes.length > 0 ? componentes : [[limpo]];
}

/**
 * Uma linha de ingredientes conta como "em casa" se todos os seus componentes estiverem
 * cobertos (qualquer alternativa serve), por igualdade ou por palavras completas — com
 * tolerância a singular/plural.
 */
export function ingredienteCoberto(ingrediente: string, tenho: TenhoEmCasa): boolean {
  if (tenho.size === 0) return false;
  const termos = [...tenho].map(singularizar);
  return componentesIngrediente(ingrediente).every((alts) =>
    alts.some((alt) => {
      const alvo = singularizar(alt);
      return termos.some((t) => alvo === t || contemTermo(alvo, t) || contemTermo(t, alvo));
    }),
  );
}

const QUANTIDADE = /^(?:(?:uma?|meia|meio|algumas?|alguns)\s+)?(?:[\d½¼¾.,/~≈–-]+\s*)*/u;
const UNIDADE =
  /^(?:c\.\s*(?:sopa|ch[aá]|caf[eé]|sobremesa)|kg|g|ml|dl|cl|l|dentes?|fatias?|folhas?|pitadas?|latas?|embalagens?|placas?|discos?|medidas?|raminhos?|ramos?|fios?|gotas?|copos?|ch[aá]venas?|pacotes?|rodelas?|tiras?|cubos?|punhados?)\s+(?:d[eao]s?\s+)?/u;
const FINAL =
  /\s+(?:para\s|a gosto|q\.?\s?b\.?|em\s|com\s|sem\s|cortad|picad|ralad|cozid|esmagad|fatiad|espremid|amolecid|derretid|batid|descascad|demolhad|saltead|laminad|generos|mole$|fri[oa]s?$|pequen|grandes?\b|comprid|firmes?$).*$/u;

/**
 * Nomes de ingredientes (sem quantidades nem unidades) para o autocompletar "tenho em casa":
 * "2 c. sopa de azeite" → "azeite". Só entram nomes usados em pelo menos duas receitas,
 * ordenados em pt-PT.
 */
export function listarNomesIngredientes(receitas: readonly Receita[]): string[] {
  const porChave = new Map<string, { nome: string; receitas: Set<number> }>();
  for (const r of receitas) {
    for (const ing of r.ingredientes) {
      const fragmentos = semParentesesNemRotulo(ing.toLowerCase()).split(
        /\s\+\s|,\s+|\s+e\s+|\s+ou\s+/,
      );
      for (const fragmento of fragmentos) {
        const f = fragmento.trim();
        if (!eIngrediente(normalizar(f))) continue;
        const nome = f
          .replace(QUANTIDADE, "")
          .replace(UNIDADE, "")
          .replace(FINAL, "")
          .replace(/\s[\d½¼¾]+\s/gu, " ") // "sumo de 1 limão" → "sumo de limão"
          .trim();
        const chave = singularizar(normalizar(nome));
        if (chave.length < 3) continue;
        const entrada = porChave.get(chave) ?? { nome, receitas: new Set<number>() };
        // entre "ovo" e "ovos" mostra a forma mais curta
        if (nome.length < entrada.nome.length) entrada.nome = nome;
        entrada.receitas.add(r.id);
        porChave.set(chave, entrada);
      }
    }
  }
  return [...porChave.values()]
    .filter((e) => e.receitas.size >= 2)
    .map((e) => e.nome)
    .sort((a, b) => a.localeCompare(b, "pt-PT"));
}

/** Ingredientes únicos do dataset, ordenados em pt-PT — para o autocompletar "tenho em casa". */
export function listarIngredientesUnicos(receitas: readonly Receita[]): string[] {
  const todos = new Set<string>();
  for (const r of receitas) {
    for (const ing of r.ingredientes) todos.add(ing);
  }
  return [...todos].sort((a, b) => a.localeCompare(b, "pt-PT"));
}

export function pontuarReceita(receita: Receita, tenho: TenhoEmCasa): Sugestao {
  let cobertos = 0;
  for (const ing of receita.ingredientes) {
    if (ingredienteCoberto(ing, tenho)) cobertos += 1;
  }
  const total = receita.ingredientes.length;
  return { receita, cobertos, total, rácio: total === 0 ? 1 : cobertos / total };
}

/**
 * Sugestões "o que posso cozinhar com o que tenho em casa": pontua cada receita pela
 * cobertura de ingredientes e ordena por rácio desc, depois tempo asc, depois id.
 */
export function sugerirReceitas(
  receitas: readonly Receita[],
  tenho: TenhoEmCasa,
  soCompletas = false,
): Sugestao[] {
  const sugestoes = receitas.map((r) => pontuarReceita(r, tenho));
  const filtradas = soCompletas ? sugestoes.filter((s) => s.rácio === 1) : sugestoes;
  return [...filtradas].sort(
    (a, b) => b.rácio - a.rácio || a.receita.tempo - b.receita.tempo || a.receita.id - b.receita.id,
  );
}
