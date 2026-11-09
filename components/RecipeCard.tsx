"use client";

import { SquareArrowOutUpRight } from "lucide-react";
import Link from "next/link";
import { CORES_CAT, CORES_METODO, METODO_EMOJI } from "@/lib/constants";
import { ajusteDescricao, aplicarAjusteModelo, temAjuste } from "@/lib/models";
import type { ModeloAirfryer, Receita } from "@/lib/types";

interface RecipeCardProps {
  receita: Receita;
  modelo: ModeloAirfryer;
  expandida: boolean;
  onToggleExpand: (id: number) => void;
  favorita: boolean;
  onToggleFavorita: (id: number) => void;
  marcados: number[];
  onToggleIngrediente: (receitaId: number, indice: number) => void;
  cobertura?: { cobertos: number; total: number };
}

export default function RecipeCard({
  receita: r,
  modelo,
  expandida,
  onToggleExpand,
  favorita,
  onToggleFavorita,
  marcados,
  onToggleIngrediente,
  cobertura,
}: RecipeCardProps) {
  const conjuntoMarcados = new Set(marcados);
  const ajustada = aplicarAjusteModelo(r, modelo);
  return (
    <article
      id={`receita-${r.id}`}
      className="scroll-mt-40 rounded-2xl border border-stone-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md dark:border-stone-800 dark:bg-stone-900"
    >
      <div className="flex items-start gap-3">
        <span className="text-3xl leading-none" aria-hidden>
          {r.emoji}
        </span>
        <button
          type="button"
          onClick={() => onToggleExpand(r.id)}
          aria-expanded={expandida}
          className="flex-1 text-left"
        >
          <h2 className="text-base font-semibold leading-snug text-stone-900 dark:text-stone-100">
            {r.nome}
          </h2>
        </button>
        <button
          type="button"
          onClick={() => onToggleFavorita(r.id)}
          aria-label={favorita ? "Remover dos favoritos" : "Adicionar aos favoritos"}
          aria-pressed={favorita}
          className="text-xl leading-none transition-transform hover:scale-110"
        >
          {favorita ? "⭐" : "☆"}
        </button>
        <Link
          href={`/receita/${r.id}`}
          aria-label={`Abrir página de ${r.nome}`}
          title="Abrir página da receita"
          className="text-stone-400 transition-colors hover:text-stone-700 dark:text-stone-500 dark:hover:text-stone-200"
        >
          <SquareArrowOutUpRight className="h-4 w-4" aria-hidden />
        </Link>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5 text-xs">
        <span className={`rounded-full border px-2 py-0.5 font-medium ${CORES_METODO[r.metodo]}`}>
          {METODO_EMOJI[r.metodo]} {r.metodo}
        </span>
        <span className={`rounded-full border px-2 py-0.5 font-medium ${CORES_CAT[r.cat]}`}>
          {r.cat}
        </span>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
          ⏱ {ajustada.tempo} min
        </span>
        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-600 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
          🎯 {r.dificuldade}
        </span>
        {cobertura && (
          <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200">
            🧺 {cobertura.cobertos}/{cobertura.total} em casa
          </span>
        )}
        {temAjuste(modelo) && (
          <span
            className="rounded-full border border-amber-300 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200"
            title={`Ajuste do modelo ${modelo.nome}: ${ajusteDescricao(modelo.ajuste)}`}
          >
            ⚙️ {modelo.nome}
          </span>
        )}
      </div>
      {expandida && (
        <div className="mt-4 grid gap-5 border-t border-stone-100 pt-4 dark:border-stone-800 md:grid-cols-2">
          <section aria-label="Ingredientes">
            <h3 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
              🧺 Ingredientes{" "}
              <span className="ml-1 font-normal text-stone-500 dark:text-stone-400">
                {marcados.length}/{r.ingredientes.length}
              </span>
            </h3>
            <ul className="mt-2 space-y-1.5">
              {r.ingredientes.map((ing, i) => {
                const marcado = conjuntoMarcados.has(i);
                return (
                  <li key={i}>
                    <label
                      className={`flex cursor-pointer items-start gap-2 text-sm ${
                        marcado
                          ? "text-stone-400 line-through dark:text-stone-500"
                          : "text-stone-700 dark:text-stone-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={marcado}
                        onChange={() => onToggleIngrediente(r.id, i)}
                        className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900 dark:accent-stone-100"
                      />
                      <span>{ing}</span>
                    </label>
                  </li>
                );
              })}
            </ul>
          </section>
          <section aria-label="Preparação">
            <div className="flex flex-wrap gap-1.5 text-xs">
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-700 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
                🌡 {ajustada.temp}
              </span>
              <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-700 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
                🍽 {r.doses}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold text-stone-800 dark:text-stone-200">
              👨‍🍳 Passos
            </h3>
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
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-stone-900 text-xs font-semibold text-white dark:bg-stone-100 dark:text-stone-900">
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
  );
}
