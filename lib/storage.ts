import { RECEITAS } from "./data";

const CHAVE_FAVORITAS = "af200:favoritas";
const CHAVE_INGREDIENTES = "af200:ingredientes";
const CHAVE_MODELO_ATIVO = "af200:modelo-ativo";
const EVENTO_INGREDIENTES = "af200:ingredientes-alterados";

/**
 * Nº de ingredientes por receita (id → length). O localStorage é entrada não confiável
 * (qualquer script same-origin escreve lá), por isso os índices persistidos são validados
 * contra o dataset: ids desconhecidos, índices fora de [0, length) e duplicados são descartados.
 */
const LIMITE_INDICES = new Map<number, number>(RECEITAS.map((r) => [r.id, r.ingredientes.length]));

function lerJSON(chave: string): unknown {
  try {
    const raw = localStorage.getItem(chave);
    if (raw === null) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export function lerFavoritas(): Set<number> {
  const dados = lerJSON(CHAVE_FAVORITAS);
  if (!Array.isArray(dados)) return new Set();
  return new Set(dados.filter((x): x is number => typeof x === "number" && Number.isInteger(x)));
}

export function guardarFavoritas(favoritas: ReadonlySet<number>): void {
  try {
    localStorage.setItem(CHAVE_FAVORITAS, JSON.stringify([...favoritas].sort((a, b) => a - b)));
  } catch {
    // localStorage indisponível (modo privado, etc.) — ignora
  }
}

export function lerIngredientesMarcados(): Record<number, number[]> {
  const dados = lerJSON(CHAVE_INGREDIENTES);
  if (typeof dados !== "object" || dados === null || Array.isArray(dados)) return {};
  const resultado: Record<number, number[]> = {};
  for (const [chave, valor] of Object.entries(dados)) {
    if (!Array.isArray(valor)) continue;
    const id = Number(chave);
    const limite = LIMITE_INDICES.get(id);
    // id desconhecido ou índices fora de [0, limite) são descartados (localStorage hostil)
    if (!Number.isInteger(id) || limite === undefined) continue;
    const unicos = new Set<number>();
    for (const x of valor) {
      if (typeof x === "number" && Number.isInteger(x) && x >= 0 && x < limite) unicos.add(x);
    }
    if (unicos.size > 0) resultado[id] = [...unicos].sort((a, b) => a - b);
  }
  return resultado;
}

export function guardarIngredientesMarcados(marcados: Record<number, number[]>): void {
  try {
    localStorage.setItem(CHAVE_INGREDIENTES, JSON.stringify(marcados));
    window.dispatchEvent(new Event(EVENTO_INGREDIENTES));
  } catch {
    // localStorage indisponível — ignora
  }
}

/**
 * Chama `aoMudar` sempre que os ingredientes marcados mudam — nesta página (evento próprio) ou
 * noutro separador (evento `storage`). Devolve a função para cancelar a subscrição.
 */
export function subscreverIngredientesMarcados(aoMudar: () => void): () => void {
  const aoStorage = (e: StorageEvent) => {
    if (e.key === null || e.key === CHAVE_INGREDIENTES) aoMudar();
  };
  window.addEventListener(EVENTO_INGREDIENTES, aoMudar);
  window.addEventListener("storage", aoStorage);
  return () => {
    window.removeEventListener(EVENTO_INGREDIENTES, aoMudar);
    window.removeEventListener("storage", aoStorage);
  };
}

export function lerModeloAtivoId(): string | null {
  try {
    const raw = localStorage.getItem(CHAVE_MODELO_ATIVO);
    return typeof raw === "string" && raw !== "" ? raw : null;
  } catch {
    return null;
  }
}

export function guardarModeloAtivoId(id: string): void {
  try {
    localStorage.setItem(CHAVE_MODELO_ATIVO, id);
  } catch {
    // localStorage indisponível — ignora
  }
}
