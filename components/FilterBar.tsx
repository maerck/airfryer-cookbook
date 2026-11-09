"use client";

import { ChefHat, Dices, Plus, Search, ShoppingCart, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CATEGORIAS, DIFICULDADES, METODO_CHIP, METODO_EMOJI, METODOS } from "@/lib/constants";
import { TOTAL_RECEITAS } from "@/lib/data";
import type { EstadoFiltroURL, MetodoFiltro, Ordem } from "@/lib/filters";
import type { Categoria, Dificuldade, Metodo } from "@/lib/types";

const TEMPOS_MAX = [15, 30, 45, 60] as const;
const ATRASO_PESQUISA_MS = 200;

const ORDENACOES: readonly { valor: Ordem; rotulo: string }[] = [
  { valor: "padrao", rotulo: "Padr\u00e3o" },
  { valor: "tempo", rotulo: "Tempo (crescente)" },
  { valor: "tempo-desc", rotulo: "Tempo (decrescente)" },
  { valor: "nome", rotulo: "Nome (A\u2013Z)" },
  { valor: "dificuldade", rotulo: "Dificuldade" },
];

interface FilterBarProps {
  estado: EstadoFiltroURL;
  onEstadoChange: (patch: Partial<EstadoFiltroURL>) => void;
  contagemMetodos: Record<Metodo, number>;
  totalFavoritas: number;
  totalListaCompras: number;
  aMostrar: number;
  onLimparFiltros: () => void;
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

const chipBase =
  "min-h-11 shrink-0 whitespace-nowrap rounded-full border px-3 py-1 text-sm transition-colors sm:min-h-0";
const chipAtivo =
  "border-stone-900 bg-stone-900 text-white dark:border-stone-100 dark:bg-stone-100 dark:text-stone-900";
const chipInativo =
  "border-stone-200 bg-white text-stone-600 hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500";
const rail =
  "flex flex-nowrap items-center gap-1.5 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] sm:flex-wrap sm:overflow-x-visible [&::-webkit-scrollbar]:hidden";
const separador = "mx-1 hidden h-5 w-px shrink-0 bg-stone-300 dark:bg-stone-700 sm:block";

export default function FilterBar({
  estado,
  onEstadoChange,
  contagemMetodos,
  totalFavoritas,
  totalListaCompras,
  aMostrar,
  onLimparFiltros,
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

  const filtrosAtivos =
    estado.q.trim() !== "" ||
    estado.metodo !== "Todos" ||
    estado.cat !== null ||
    estado.dif !== null ||
    estado.tempoMax !== null ||
    estado.soFavoritas ||
    estado.ordem !== "padrao";

  const adicionarTenho = () => {
    const t = textoTenho.trim();
    if (t !== "") onAdicionarTenho(t);
    setTextoTenho("");
  };

  return (
    <div className="sticky top-0 z-20 border-b border-stone-200 bg-stone-100/90 backdrop-blur dark:border-stone-800 dark:bg-stone-950/90">
      <div className="mx-auto max-w-6xl space-y-1.5 px-4 py-2 sm:space-y-2 sm:py-3">
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
              className="min-h-11 w-full rounded-full border border-stone-200 bg-white py-2 pl-9 pr-3 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500 dark:focus:border-stone-500 sm:min-h-0"
            />
          </div>
          <button
            type="button"
            onClick={onSurpreendeMe}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-full bg-amber-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 sm:min-h-0"
          >
            <Dices className="h-4 w-4" aria-hidden /> <span aria-hidden>\ud83c\udfb2</span>{" "}
            Surpreende-me
          </button>
          <p
            role="status"
            aria-live="polite"
            className="text-sm text-stone-500 dark:text-stone-400"
          >
            A mostrar <strong className="text-stone-900 dark:text-stone-100">{aMostrar}</strong> de{" "}
            {TOTAL_RECEITAS} receitas
          </p>
          <div className="flex items-center gap-1.5">
            <Link
              href="/lista-compras"
              aria-label={`Lista de compras${totalListaCompras > 0 ? ` (${totalListaCompras} itens)` : ""}`}
              title="Lista de compras"
              className="relative flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
            >
              <ShoppingCart className="h-5 w-5" aria-hidden />
              {totalListaCompras > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-xs font-semibold text-stone-950">
                  {totalListaCompras}
                </span>
              )}
            </Link>
            <Link
              href="/modelos"
              aria-label="Modelos de airfryer"
              title="Modelos"
              className="flex h-11 w-11 items-center justify-center rounded-full border border-stone-200 bg-white text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
            >
              <ChefHat className="h-5 w-5" aria-hidden />
            </Link>
          </div>
        </div>
        <div className={rail}>
          <button
            type="button"
            onClick={() => onEstadoChange({ metodo: "Todos" })}
            aria-pressed={estado.metodo === "Todos"}
            className={`${chipBase} ${estado.metodo === "Todos" ? chipAtivo : chipInativo}`}
          >
            Todos ({TOTAL_RECEITAS})
          </button>
          {METODOS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onEstadoChange({ metodo: m as MetodoFiltro })}
              aria-pressed={estado.metodo === m}
              className={`${chipBase} ${estado.metodo === m ? chipAtivo : chipInativo}`}
            >
              <span aria-hidden>{METODO_EMOJI[m]}</span> {METODO_CHIP[m]} ({contagemMetodos[m]})
            </button>
          ))}
        </div>
        <div className={rail}>
          {CATEGORIAS.map((c: Categoria) => (
            <button
              key={c}
              type="button"
              onClick={() => onEstadoChange({ cat: estado.cat === c ? null : c })}
              aria-pressed={estado.cat === c}
              className={`${chipBase} ${estado.cat === c ? chipAtivo : chipInativo}`}
            >
              {c}
            </button>
          ))}
          <span className={separador} aria-hidden />
          <button
            type="button"
            onClick={() => onEstadoChange({ soFavoritas: !estado.soFavoritas })}
            aria-pressed={estado.soFavoritas}
            className={`${chipBase} ${estado.soFavoritas ? chipAtivo : chipInativo}`}
          >
            <span aria-hidden>\u2b50</span> S\u00f3 favoritas ({totalFavoritas})
          </button>
          <button
            type="button"
            onClick={onToggleModoTenho}
            aria-pressed={modoTenho}
            className={`${chipBase} ${modoTenho ? chipAtivo : chipInativo}`}
          >
            <span aria-hidden>\ud83e\uddfa</span> O que tenho em casa
          </button>
        </div>
        <div className={rail}>
          <label className="flex shrink-0 items-center gap-1.5 text-sm text-stone-500 dark:text-stone-400">
            Ordenar:
            <select
              value={estado.ordem}
              onChange={(e) => onEstadoChange({ ordem: e.target.value as Ordem })}
              aria-label="Ordenar receitas"
              className="min-h-11 rounded-full border border-stone-200 bg-white px-3 py-2 text-sm text-stone-700 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 sm:min-h-0 sm:py-1"
            >
              {ORDENACOES.map((o) => (
                <option key={o.valor} value={o.valor}>
                  {o.rotulo}
                </option>
              ))}
            </select>
          </label>
          <span className={separador} aria-hidden />
          {DIFICULDADES.map((d: Dificuldade) => (
            <button
              key={d}
              type="button"
              onClick={() => onEstadoChange({ dif: estado.dif === d ? null : d })}
              aria-pressed={estado.dif === d}
              className={`${chipBase} ${estado.dif === d ? chipAtivo : chipInativo}`}
            >
              <span aria-hidden>\ud83c\udfaf</span> {d}
            </button>
          ))}
          <span className={separador} aria-hidden />
          {TEMPOS_MAX.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onEstadoChange({ tempoMax: estado.tempoMax === t ? null : t })}
              aria-pressed={estado.tempoMax === t}
              className={`${chipBase} ${estado.tempoMax === t ? chipAtivo : chipInativo}`}
            >
              <span aria-hidden>\u23f1</span> \u2264{t} min
            </button>
          ))}
          {filtrosAtivos && (
            <button
              type="button"
              onClick={onLimparFiltros}
              className={`${chipBase} border-amber-300 bg-amber-100 font-medium text-amber-900 hover:border-amber-500 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200 dark:hover:border-amber-700`}
            >
              <X className="h-4 w-4" aria-hidden /> Limpar filtros
            </button>
          )}
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
                className="min-h-11 min-w-56 flex-1 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-900 placeholder:text-stone-400 focus:border-stone-500 focus:outline-none dark:border-stone-700 dark:bg-stone-900 dark:text-stone-100 dark:placeholder:text-stone-500"
              />
              <datalist id="lista-ingredientes-disponiveis">
                {ingredientesDisponiveis.map((ing) => (
                  <option key={ing} value={ing} />
                ))}
              </datalist>
              <button
                type="button"
                onClick={adicionarTenho}
                className="inline-flex min-h-11 items-center gap-1 rounded-full bg-stone-900 px-3 py-1.5 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
              >
                <Plus className="h-4 w-4" aria-hidden /> Adicionar
              </button>
              <button
                type="button"
                onClick={onToggleSoCompletas}
                aria-pressed={soCompletas}
                className={`${chipBase} ${soCompletas ? chipAtivo : chipInativo}`}
              >
                <span aria-hidden>\u2714</span> S\u00f3 receitas completas
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
                      className="flex h-6 w-6 items-center justify-center rounded-full hover:text-emerald-900 dark:hover:text-emerald-100"
                    >
                      <X className="h-3 w-3" aria-hidden />
                    </button>
                  </span>
                ))}
              </div>
            )}
            <p className="text-xs text-stone-500 dark:text-stone-400">
              As receitas s\u00e3o ordenadas pela quantidade de ingredientes que j\u00e1 tens em
              casa.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
