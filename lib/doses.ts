/**
 * Escala as quantidades dos ingredientes pelo fator dosesAlvo/dosesBase.
 * Conservador: só escala o número inicial do ingrediente (ex.: "2 dentes de
 * alho" → "4 dentes de alho"); números no meio do texto (ex.: "cesto de 7 L")
 * ficam intactos. "sal q.b." e afins não mudam. Frações ("1/2") e intervalos
 * ("2–3") são suportados.
 */
const NUMERO_INICIAL = /^(\s*)(\d+\s*\/\s*\d+|\d+(?:[.,]\d+)?(?:\s*[–-]\s*\d+(?:[.,]\d+)?)?)/;

function formatarNumero(n: number): string {
  const arredondado = Math.round(n * 100) / 100;
  return String(arredondado).replace(".", ",");
}

function escalarToken(token: string, fator: number): string {
  const limpo = token.trim();
  if (limpo.includes("/")) {
    const partes = limpo.split("/");
    const numerador = Number(partes[0]?.trim());
    const denominador = Number(partes[1]?.trim());
    if (!Number.isFinite(numerador) || !Number.isFinite(denominador) || denominador === 0) {
      return token;
    }
    return formatarNumero((numerador / denominador) * fator);
  }
  const valor = Number(limpo.replace(",", "."));
  if (!Number.isFinite(valor)) return token;
  return formatarNumero(valor * fator);
}

export function escalarIngrediente(ingrediente: string, fator: number): string {
  if (fator === 1) return ingrediente;
  const match = NUMERO_INICIAL.exec(ingrediente);
  if (!match) return ingrediente;
  const [, espacos, numero] = match;
  const escalado = numero
    .split(/[–-]/)
    .map((parte) => escalarToken(parte, fator))
    .join("–");
  return espacos + escalado + ingrediente.slice(match[0].length);
}

export function escalarIngredientes(ingredientes: readonly string[], fator: number): string[] {
  if (fator === 1) return [...ingredientes];
  return ingredientes.map((ing) => escalarIngrediente(ing, fator));
}
