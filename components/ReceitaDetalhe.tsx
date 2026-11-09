"use client";

import { ArrowLeft, ChefHat, ChevronLeft, ChevronRight, Printer, Timer, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { extrairMinutosDoPasso, formatarDuracao } from "@/lib/cook";
import { CORES_CAT, CORES_METODO, METODO_EMOJI, RECEITAS, TOTAL_RECEITAS } from "@/lib/data";
import { aplicarAjusteModelo, encontrarModelo, MODELO_PADRAO, temAjuste } from "@/lib/models";
import {
  guardarFavoritas,
  guardarIngredientesMarcados,
  lerFavoritas,
  lerIngredientesMarcados,
  lerModeloAtivoId,
} from "@/lib/storage";
import type { ModeloAirfryer, Receita } from "@/lib/types";

interface ReceitaDetalheProps {
  receita: Receita;
}

export default function ReceitaDetalhe({ receita: r }: ReceitaDetalheProps) {
  const [modelo, setModelo] = useState<ModeloAirfryer>(MODELO_PADRAO);
  const [favorita, setFavorita] = useState(false);
  const [marcados, setMarcados] = useState<number[]>([]);
  const [hidratado, setHidratado] = useState(false);
  const [modoCozinhar, setModoCozinhar] = useState(false);
  const [passoAtual, setPassoAtual] = useState(0);
  const [segundos, setSegundos] = useState<number | null>(null);
  const [timerAtivo, setTimerAtivo] = useState(false);

  useEffect(() => {
    setModelo(encontrarModelo(lerModeloAtivoId()));
    setFavorita(lerFavoritas().has(r.id));
    setMarcados(lerIngredientesMarcados()[r.id] ?? []);
    setHidratado(true);
  }, [r.id]);

  useEffect(() => {
    if (hidratado) {
      const favoritas = lerFavoritas();
      if (favorita) favoritas.add(r.id);
      else favoritas.delete(r.id);
      guardarFavoritas(favoritas);
    }
  }, [favorita, hidratado, r.id]);

  useEffect(() => {
    if (hidratado) {
      const todos = lerIngredientesMarcados();
      if (marcados.length === 0) delete todos[r.id];
      else todos[r.id] = [...marcados].sort((a, b) => a - b);
      guardarIngredientesMarcados(todos);
    }
  }, [marcados, hidratado, r.id]);

  useEffect(() => {
    if (!modoCozinhar) return;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (tipo: "screen") => Promise<{ release: () => Promise<void> }> };
    };
    let ativo = true;
    let sentinela: { release: () => Promise<void> } | null = null;
    nav.wakeLock
      ?.request("screen")
      .then((s) => {
        if (ativo) sentinela = s;
        else s.release().catch(() => {});
      })
      .catch(() => {});
    return () => {
      ativo = false;
      if (sentinela) sentinela.release().catch(() => {});
    };
  }, [modoCozinhar]);

  useEffect(() => {
    if (!timerAtivo) return;
    const id = window.setInterval(() => setSegundos((s) => (s === null ? s : s - 1)), 1000);
    return () => window.clearInterval(id);
  }, [timerAtivo]);

  useEffect(() => {
    if (timerAtivo && segundos !== null && segundos <= 0) {
      setTimerAtivo(false);
      navigator.vibrate?.(200);
    }
  }, [segundos, timerAtivo]);

  const toggleIngrediente = (indice: number) => {
    setMarcados((prev) =>
      prev.includes(indice)
        ? prev.filter((i) => i !== indice)
        : [...prev, indice].sort((a, b) => a - b),
    );
  };

  const minutosPasso = extrairMinutosDoPasso(r.passos[passoAtual] ?? "");

  const entrarModoCozinhar = () => {
    setPassoAtual(0);
    setSegundos(null);
    setTimerAtivo(false);
    setModoCozinhar(true);
  };

  const irParaPasso = (novo: number) => {
    setPassoAtual(novo);
    setSegundos(null);
    setTimerAtivo(false);
  };

  const iniciarTemporizador = () => {
    if (minutosPasso === null) return;
    setSegundos(minutosPasso * 60);
    setTimerAtivo(true);
  };

  const ajustada = aplicarAjusteModelo(r, modelo);

  const indiceAtual = RECEITAS.findIndex((x) => x.id === r.id);
  const anterior = indiceAtual > 0 ? RECEITAS[indiceAtual - 1] : undefined;
  const seguinte =
    indiceAtual >= 0 && indiceAtual < RECEITAS.length - 1 ? RECEITAS[indiceAtual + 1] : undefined;

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white print:hidden">
        <div className="mx-auto max-w-4xl px-4 py-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-stone-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar às receitas
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-4xl px-4 py-6">
        <article className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm dark:border-stone-800 dark:bg-stone-900">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex items-start gap-3">
              <span className="text-4xl leading-none" aria-hidden>
                {r.emoji}
              </span>
              <div>
                <h1 className="text-2xl font-bold tracking-tight text-stone-900 dark:text-stone-100 sm:text-3xl">
                  {r.nome}
                </h1>
                <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span
                    className={`rounded-full border px-2 py-0.5 font-medium ${CORES_METODO[r.metodo]}`}
                  >
                    {METODO_EMOJI[r.metodo]} {r.metodo}
                  </span>
                  <span
                    className={`rounded-full border px-2 py-0.5 font-medium ${CORES_CAT[r.cat]}`}
                  >
                    {r.cat}
                  </span>
                  <span className="rounded-full border border-amber-300 bg-amber-100 px-2 py-0.5 font-semibold text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    ⏱ {ajustada.tempo} min
                  </span>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
                    🎯 {r.dificuldade}
                  </span>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
                    🌡 {ajustada.temp}
                  </span>
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
                    🍽 {r.doses} doses
                  </span>
                  {temAjuste(modelo) && (
                    <span
                      className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
                      title={`Ajustado ao modelo ${modelo.nome}`}
                    >
                      ⚙️ {modelo.nome}
                    </span>
                  )}
                </div>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 print:hidden">
              <button
                type="button"
                onClick={() => setFavorita((v) => !v)}
                aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
                aria-pressed={favorita}
                className="flex h-11 w-11 items-center justify-center rounded-full text-2xl leading-none transition-transform hover:scale-110"
              >
                <span aria-hidden>{favorita ? "⭐" : "☆"}</span>
              </button>
              <button
                type="button"
                onClick={entrarModoCozinhar}
                aria-pressed={modoCozinhar}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-white/10 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-white/20"
              >
                <ChefHat className="h-4 w-4" aria-hidden /> Modo cozinhar
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
              >
                <Printer className="h-4 w-4" aria-hidden /> Imprimir
              </button>
            </div>
          </div>
          {modoCozinhar ? (
            <section
              aria-label="Modo cozinhar"
              className="mt-6 border-t border-stone-100 pt-6 dark:border-stone-800"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  <span aria-hidden>👨‍🍳</span> Modo cozinhar · Passo {passoAtual + 1} de{" "}
                  {r.passos.length}
                </h2>
                <button
                  type="button"
                  onClick={() => setModoCozinhar(false)}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
                >
                  <X className="h-4 w-4" aria-hidden /> Sair
                </button>
              </div>
              <p className="mt-4 text-xl font-medium leading-relaxed text-stone-900 dark:text-stone-100">
                {r.passos[passoAtual]}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                {segundos === null ? (
                  minutosPasso !== null && (
                    <button
                      type="button"
                      onClick={iniciarTemporizador}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
                    >
                      <Timer className="h-4 w-4" aria-hidden /> Iniciar temporizador ({minutosPasso}{" "}
                      min)
                    </button>
                  )
                ) : (
                  <>
                    <span
                      role="status"
                      aria-live="polite"
                      className={`inline-flex min-h-11 items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold tabular-nums ${
                        segundos === 0
                          ? "bg-emerald-600 text-white"
                          : "bg-stone-900 text-white dark:bg-stone-100 dark:text-stone-900"
                      }`}
                    >
                      <Timer className="h-4 w-4" aria-hidden />
                      {segundos === 0 ? "Terminado!" : formatarDuracao(segundos)}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSegundos(null);
                        setTimerAtivo(false);
                      }}
                      className="min-h-11 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
                    >
                      Cancelar temporizador
                    </button>
                  </>
                )}
              </div>
              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => irParaPasso(Math.max(0, passoAtual - 1))}
                  disabled={passoAtual === 0}
                  className="inline-flex min-h-11 items-center gap-1 rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 disabled:opacity-40 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-500"
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden /> Anterior
                </button>
                {passoAtual < r.passos.length - 1 ? (
                  <button
                    type="button"
                    onClick={() => irParaPasso(passoAtual + 1)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
                  >
                    Seguinte <ChevronRight className="h-4 w-4" aria-hidden />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setModoCozinhar(false)}
                    className="inline-flex min-h-11 items-center gap-1 rounded-full bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-800"
                  >
                    <span aria-hidden>✓</span> Concluir
                  </button>
                )}
              </div>
            </section>
          ) : (
            <div className="mt-6 grid gap-6 border-t border-stone-100 pt-6 dark:border-stone-800 md:grid-cols-2">
              <section aria-label="Ingredientes">
                <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  🧺 Ingredientes{" "}
                  <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">
                    {marcados.length}/{r.ingredientes.length}
                  </span>
                </h2>
                <ul className="mt-2 space-y-1.5 text-sm">
                  {r.ingredientes.map((ing, i) => {
                    const marcado = marcados.includes(i);
                    return (
                      <li key={i}>
                        <label
                          className={`flex cursor-pointer items-start gap-2 print:list-item print:list-disc print:pl-0 ${
                            marcado
                              ? "text-stone-400 line-through dark:text-stone-500"
                              : "text-stone-700 dark:text-stone-300"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={marcado}
                            onChange={() => toggleIngrediente(i)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900 print:hidden dark:accent-stone-100"
                          />
                          <span className="print:ml-5">{ing}</span>
                        </label>
                      </li>
                    );
                  })}
                </ul>
              </section>
              <section aria-label="Preparação">
                <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                  👨‍🍳 Passos
                </h2>
                <ol className="mt-2 space-y-2">
                  {r.passos.map((passo, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm text-stone-700 dark:text-stone-300"
                    >
                      <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-900 print:bg-stone-900 print:text-white">
                        {i + 1}
                      </span>
                      <span className="pt-0.5">{passo}</span>
                    </li>
                  ))}
                </ol>
                {r.dica && (
                  <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                    <strong>💡 Dica</strong> — {r.dica}
                  </div>
                )}
              </section>
            </div>
          )}
        </article>
        <nav
          aria-label="Navegação entre receitas"
          className="mt-6 flex items-center justify-between gap-3 text-sm print:hidden"
        >
          {anterior ? (
            <Link
              href={`/receita/${anterior.id}`}
              className="text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-stone-100"
            >
              ← {anterior.nome}
            </Link>
          ) : (
            <span />
          )}
          {seguinte ? (
            <Link
              href={`/receita/${seguinte.id}`}
              className="text-right text-stone-600 underline decoration-stone-300 underline-offset-2 hover:text-stone-900 dark:text-stone-300 dark:decoration-stone-600 dark:hover:text-stone-100"
            >
              {seguinte.nome} →
            </Link>
          ) : (
            <span />
          )}
        </nav>
        <p className="mt-4 text-center text-sm text-stone-500 dark:text-stone-400 print:hidden">
          <Link
            href="/"
            className="underline decoration-stone-300 underline-offset-2 hover:text-stone-700 dark:decoration-stone-700 dark:hover:text-stone-200"
          >
            Ver as {TOTAL_RECEITAS} receitas
          </Link>
        </p>
      </main>
    </div>
  );
}
