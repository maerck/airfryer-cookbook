"use client";

import { Dices, Plus, Search, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, DIFICULDADES, METODO_CHIP, METODO_EMOJI, METODOS } from "@/lib/constants";
import { TOTAL_RECEITAS } from "@/lib/data";
import type { EstadoFiltroURL, MetodoFiltro, Ordem } from "@/lib/filters";
import type { Categoria, Dificuldade, Metodo } from "@/lib/types";

const TEMPOS_MAX = [15, 30, 45, 60] as const;
const ATRASO_PESQUISA_MS = 200;

const ORDENACOES: readonly { valor: Ordem; rotulo: string }[] = [
  { valor: "padrao", rotulo: "Padrão" },
  { valor: "tempo", rotulo: "⏱ Tempo (crescente)" },
  { valor: "tempo-desc", rotulo: "⏱ Tempo (decrescente)" },
  { valor: "nome", rotulo: "🔤 Nome (A–Z)" },
  { valor: "dificuldade", rotulo: "🎯 Dificuldade" },
];

interface FilterBarProps {
  estado: EstadoFiltroURL;
  onEstadoChange: (patch: Partial<EstadoFiltroURL>) => void;
  contagemMetodos: Record<Metodo, number>;
  totalFavoritas: number;
  aMostrar: number;
  onSurpreendeMe: () => void;
  modoTenho: boolean;
  onToggleModoTenho: () => void;
  tenho: string[];
  onAdicionarTenho: (item: string) => void;
  onRemoverTenho: (item: string) => void;
  soCompletas: boolean;
  onToggleSoCompletas: () => void;
  ingredientesDisponiveis: string[];
}

const chipBase = "rounded-full border px-3 py-1 text-sm transition-colors";
const chipAtivo =
  "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900";
const chipInativo =
  "border-stone-200 bg-white text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500";

export default function FilterBar({
  estado,
  onEstadoChange,
  contagemMetodos,
  totalFavoritas,
  aMostrar,
  onSurpreendeMe,
  modoTenho,
  onToggleModoTenho,
  tenho,
  onAdicionarTenho,
  onRemoverTenho,
  soCompletas,
  onToggleSoCompletas,
  ingredientesDisponiveis,
}: FilterBarProps) {
  const [textoTenho, setTextoTenho] = useState("");

  // A pesquisa tem estado local: a URL atualiza-se de forma assíncrona e, se o campo dependesse
  // dela, o cursor saltava e perdiam-se teclas. A URL é sincronizada com um pequeno atraso.
  const [q, setQ] = useState(estado.q);
  const qEnviado = useRef(estado.q);
  const temporizador = useRef<number | null>(null);
  const onEstadoChangeRef = useRef(onEstadoChange);
  useEffect(() => {
    onEstadoChangeRef.current = onEstadoChange;
  }, [onEstadoChange]);

  // A URL mudou por fora (Limpar filtros, voltar atrás no histórico) → repõe o campo.
  useEffect(() => {
    const enviado = qEnviado.current;
    const igual = estado.q === enviado || (estado.q.trim() === "" && enviado.trim() === "");
    if (igual) return;
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    temporizador.current = null;
    qEnviado.current = estado.q;
    setQ(estado.q);
  }, [estado.q]);

  useEffect(
    () => () => {
      if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    },
    [],
  );

  const aoPesquisar = (valor: string) => {
    setQ(valor);
    if (temporizador.current !== null) window.clearTimeout(temporizador.current);
    temporizador.current = window.setTimeout(() => {
      temporizador.current = null;
      qEnviado.current = valor;
      onEstadoChangeRef.current({ q: valor });
    }, ATRASO_PESQUISA_MS);
  };

  const adicionarTenho = () => {
    const t = textoTenho.trim();
    if (t !== "") onAdicionarTenho(t);
    setTextoTenho("");
  };

  return (
    <div className="sticky top-0 z-20 border-b border-stone-200 bg-stone-100/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto max-w-6xl space-y-2 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-56 flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400"
              aria-hidden
            />
            <input
              id="campo-pesquisa"
              type="search"
              value={q}
              onChange={(e) => aoPesquisar(e.target.value)}
              placeholder="🔍 Procurar por nome ou ingrediente…"
              aria-label="Procurar por nome ou ingrediente"
              className="w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500"
            />
          </div>
          <button
            type="button"
            onClick={onSurpreendeMe}
            className="inline-flex items-center gap-1.5 rounded-full bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700"
          >
            <Dices className="h-4 w-4" aria-hidden /> 🎲 Surpreende-me
          </button>
          <p className="text-sm text-stone-500 dark:text-stone-400">
            A mostrar <strong className="text-stone-900 dark:text-stone-100">{aMostrar}</strong> de{" "}
            {TOTAL_RECEITAS} receitas
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => onEstadoChange({ metodo: "Todos" })}
            className={`${chipBase} ${estado.metodo === "Todos" ? chipAtivo : chipInativo}`}
          >
            Todos ({TOTAL_RECEITAS})
          </button>
          {METODOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onEstadoChange({ metodo: m as MetodoFiltro })}
              className={`${chipBase} ${estado.metodo === m ? chipAtivo : chipInativo}`}
            >
              {METODO_EMOJI[m]} {METODO_CHIP[m]} ({contagemMetodos[m]})
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          {CATEGORIAS.map((c: Categoria) => (
            <button
              key={c}
              type="button"
              onClick={() => onEstadoChange({ cat: estado.cat === c ? null : c })}
              className={`${chipBase} ${estado.cat === c ? chipAtivo : chipInativo}`}
            >
              {c}
            </button>
          ))}
          <span
            className="mx-1 hidden h-5 w-px bg-stone-300 dark:bg-stone-700 sm:block"
            aria-hidden
          />
          <button
            type="button"
            onClick={() => onEstadoChange({ soFavoritas: !estado.soFavoritas })}
            className={`${chipBase} ${estado.soFavoritas ? chipAtivo : chipInativo}`}
          >
            ⭐ Só favoritas ({totalFavoritas})
          </button>
          <button
            type="button"
            onClick={onToggleModoTenho}
            aria-pressed={modoTenho}
            className={`${chipBase} ${modoTenho ? chipAtivo : chipInativo}`}
          >
            🧺 O que tenho em casa
          </button>
        </div>
        <div className="flex flex-wrap items-center gap-1.5">
          <label className="flex items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
            Ordenar:
            <select
              value={estado.ordem}
              onChange={(e) => onEstadoChange({ ordem: e.target.value as Ordem })}
              aria-label="Ordenar receitas"
              className="rounded-full border border-stone-200 bg-white px-3 py-1 text-sm text-stone-700 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200"
            >
              {ORDENACOES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </label>
          <span
            className="mx-1 hidden h-5 w-px bg-stone-300 dark:bg-stone-700 sm:block"
            aria-hidden
          />
          {DIFICULDADES.map((d: Dificuldade) => (
            <button
              key={d}
              type="button"
              onClick={() => onEstadoChange({ dif: estado.dif === d ? null : d })}
              className={`${chipBase} ${estado.dif === d ? chipAtivo : chipInativo}`}
            >
              🎯 {d}
            </button>
          ))}
          <span
            className="mx-1 hidden h-5 w-px bg-stone-300 dark:bg-stone-700 sm:block"
            aria-hidden
          />
          {TEMPOS_MAX.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onEstadoChange({ tempoMax: estado.tempoMax === t ? null : t })}
              className={`${chipBase} ${estado.tempoMax === t ? chipAtivo : chipInativo}`}
            >
              ⏱ ≤{t} min
            </button>
          ))}
        </div>
        {modoTenho && (
          <div className="space-y-2 rounded-2xl border border-stone-200 bg-white/70 p-3 dark:border-stone-800 dark:bg-stone-900/70">
            <div className="flex flex-wrap items-center gap-2">
              <input
                type="text"
                value={textoTenho}
                onChange={(e) => setTextoTenho(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    adicionarTenho();
                  }
                }}
                list="lista-ingredientes-disponiveis"
                placeholder="Ingrediente que tens em casa…"
                aria-label="Ingrediente que tens em casa"
                className="min-w-56 flex-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
              <datalist id="lista-ingredientes-disponiveis">
                {ingredientesDisponiveis.map((ing) => (
                  <option key={ing} value={ing} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={adicionarTenho}
                className="inline-flex items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
              >
                <Plus className="h-4 w-4" aria-hidden /> Adicionar
              </button>
              <button
                type="button"
                onClick={onToggleSoCompletas}
                aria-pressed={soCompletas}
                className={`${chipBase} ${soCompletas ? chipAtivo : chipInativo}`}
              >
                ✔ Só receitas completas
              </button>
            </div>
            {tenho.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {tenho.map((item) => (
                  <span
                    key={item}
                    className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950 dark:text-emerald-200"
                  >
                    {item}
                    <button
                      type="button"
                      onClick={() => onRemoverTenho(item)}
                      aria-label={`Remover ${item}`}
                      className="rounded-full hover:text-emerald-900 dark:hover:text-emerald-100"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-stone-500 dark:text-stone-400">
              As receitas são ordenadas pela quantidade de ingredientes que já tens em casa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
