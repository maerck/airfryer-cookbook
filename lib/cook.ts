/**
 * Extrai a duração (em minutos) mencionada num passo de receita, para o
 * temporizador do modo cozinhar. Suporta "12 min", intervalos "10–12 min"
 * (usa o limite superior) e "1 hora"/"2 horas".
 */
export function extrairMinutosDoPasso(passo: string): number | null {
  const horas = /\b(\d+)\s*horas?\b/i.exec(passo);
  if (horas) return Number(horas[1]) * 60;
  const min = /\b(\d+)\s*min\b/i.exec(passo);
  if (min) return Number(min[1]);
  return null;
}

/** Formata segundos como "mm:ss" (ou "h:mm:ss" acima de uma hora). */
export function formatarDuracao(totalSegundos: number): string {
  const s = Math.max(0, Math.ceil(totalSegundos));
  const horas = Math.floor(s / 3600);
  const minutos = Math.floor((s % 3600) / 60);
  const segundos = s % 60;
  const mm = String(minutos).padStart(2, "0");
  const ss = String(segundos).padStart(2, "0");
  if (horas > 0) return `${horas}:${mm}:${ss}`;
  return `${mm}:${ss}`;
}
