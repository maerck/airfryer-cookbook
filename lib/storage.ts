const CHAVE_FAVORITAS = "af200:favoritas";
const CHAVE_INGREDIENTES = "af200:ingredientes";
const CHAVE_MODELO_ATIVO = "af200:modelo-ativo";

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
    const indices = valor.filter((x): x is number => typeof x === "number" && Number.isInteger(x));
    if (Number.isInteger(id) && indices.length > 0) resultado[id] = indices;
  }
  return resultado;
}

export function guardarIngredientesMarcados(marcados: Record<number, number[]>): void {
  try {
    localStorage.setItem(CHAVE_INGREDIENTES, JSON.stringify(marcados));
  } catch {
    // localStorage indisponível — ignora
  }
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
