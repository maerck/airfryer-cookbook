"use client";

import { ArrowLeft, Printer } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CORES_CAT, CORES_METODO, METODO_EMOJI } from "@/lib/constants";
import { aplicarAjusteModelo, encontrarModelo, MODELO_PADRAO, temAjuste } from "@/lib/models";
import {
  guardarFavoritas,
  guardarIngredientesMarcados,
  lerFavoritas,
  lerIngredientesMarcados,
  lerModeloAtivoId,
} from "@/lib/storage";
import type { ModeloAirfryer, Receita } from "@/lib/types";

interface ReceitaVizinha {
  id: number;
  nome: string;
}

// A página (servidor) passa as vizinhas e o total: este componente cliente não importa o
// dataset, para as páginas de receita não carregarem as receitas todas.
interface ReceitaDetalheProps {
  receita: Receita;
  anterior?: ReceitaVizinha;
  seguinte?: ReceitaVizinha;
  totalReceitas: number;
}

export default function ReceitaDetalhe({
  receita: r,
  anterior,
  seguinte,
  totalReceitas,
}: ReceitaDetalheProps) {
  const [modelo, setModelo] = useState<ModeloAirfryer>(MODELO_PADRAO);
  const [favorita, setFavorita] = useState(false);
  const [marcados, setMarcados] = useState<number[]>([]);
  const [hidratado, setHidratado] = useState(false);

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

  const toggleIngrediente = (indice: number) => {
    setMarcados((prev) =>
      prev.includes(indice)
        ? prev.filter((i) => i !== indice)
        : [...prev, indice].sort((a, b) => a - b),
    );
  };

  const ajustada = aplicarAjusteModelo(r, modelo);

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
                  <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
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
                className="text-2xl leading-none transition-transform hover:scale-110"
              >
                {favorita ? "⭐" : "☆"}
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
              {ajustada.notaPassos && (
                <p className="mt-2 rounded-xl border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
                  ⚙️ {ajustada.notaPassos}
                </p>
              )}
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
            Ver as {totalReceitas} receitas
          </Link>
        </p>
      </main>
    </div>
  );
}
