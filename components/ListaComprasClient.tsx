"use client";

import { ArrowLeft, Check, ClipboardCopy, Printer, ShoppingCart, Trash2 } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { RECEITAS, TOTAL_RECEITAS } from "@/lib/data";
import { agregarListaCompras, contarListaCompras, textoListaCompras } from "@/lib/shopping";
import { guardarIngredientesMarcados, lerIngredientesMarcados } from "@/lib/storage";

export default function ListaComprasClient() {
  const [marcados, setMarcados] = useState<Record<number, number[]>>({});
  const [hidratado, setHidratado] = useState(false);
  const [copiado, setCopiado] = useState(false);

  const copiarLista = async () => {
    try {
      await navigator.clipboard.writeText(textoListaCompras(itens));
      setCopiado(true);
      window.setTimeout(() => setCopiado(false), 2000);
    } catch {
      // clipboard indisponível — ignora
    }
  };

  useEffect(() => {
    setMarcados(lerIngredientesMarcados());
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (hidratado) guardarIngredientesMarcados(marcados);
  }, [marcados, hidratado]);

  const itens = useMemo(() => agregarListaCompras(RECEITAS, marcados), [marcados]);
  const total = useMemo(() => contarListaCompras(marcados), [marcados]);

  const removerItem = (receitaId: number, indice: number) => {
    setMarcados((prev) => {
      const atuais = new Set(prev[receitaId] ?? []);
      atuais.delete(indice);
      const novo = { ...prev };
      if (atuais.size === 0) delete novo[receitaId];
      else novo[receitaId] = [...atuais].sort((a, b) => a - b);
      return novo;
    });
  };

  const limparLista = () => setMarcados({});

  const porReceita = useMemo(() => {
    const grupos = new Map<number, typeof itens>();
    for (const item of itens) {
      const grupo = grupos.get(item.receitaId) ?? [];
      grupo.push(item);
      grupos.set(item.receitaId, grupo);
    }
    return [...grupos.entries()];
  }, [itens]);

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white print:hidden">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-stone-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar às receitas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            🛒 Lista de compras
          </h1>
          <p className="mt-2 max-w-2xl text-stone-300">
            Ingredientes que marcaste nas receitas, agregados numa única lista.
          </p>
          <p className="mt-4 text-sm text-stone-400">
            {total === 0 ? "A lista está vazia" : `${total} ${total === 1 ? "item" : "itens"}`}
          </p>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">
        {itens.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-900/60">
            <ShoppingCart className="h-8 w-8 text-stone-400" aria-hidden />
            <p className="text-lg text-stone-600 dark:text-stone-300">
              🛒 A tua lista de compras está vazia.
            </p>
            <p className="max-w-md text-sm text-stone-500 dark:text-stone-400">
              Abre uma receita e marca os ingredientes de que precisas — eles aparecem aqui.
            </p>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
            >
              Ver as {TOTAL_RECEITAS} receitas
            </Link>
          </div>
        ) : (
          <div className="space-y-5">
            <div className="flex justify-end gap-2 print:hidden">
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
              >
                <Printer className="h-4 w-4" aria-hidden /> Imprimir
              </button>
              <button
                type="button"
                onClick={copiarLista}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
              >
                {copiado ? (
                  <Check className="h-4 w-4" aria-hidden />
                ) : (
                  <ClipboardCopy className="h-4 w-4" aria-hidden />
                )}
                {copiado ? "Copiado!" : "Copiar lista"}
              </button>
              <button
                type="button"
                onClick={limparLista}
                className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 bg-white px-3 py-1.5 text-sm text-stone-600 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-300 dark:hover:border-stone-500"
              >
                <Trash2 className="h-4 w-4" aria-hidden /> Limpar lista
              </button>
            </div>
            {porReceita.map(([receitaId, grupo]) => {
              const primeiro = grupo[0];
              if (!primeiro) return null;
              return (
                <section
                  key={receitaId}
                  className="rounded-2xl border border-stone-200 bg-white p-4 shadow-sm dark:border-stone-800 dark:bg-stone-900"
                >
                  <h2 className="text-sm font-semibold text-stone-800 dark:text-stone-200">
                    <Link
                      href={`/receita/${receitaId}`}
                      className="hover:underline hover:decoration-stone-300 hover:underline-offset-2 dark:hover:decoration-stone-600"
                    >
                      {primeiro.receitaEmoji} {primeiro.receitaNome}
                    </Link>
                  </h2>
                  <ul className="mt-2 space-y-1.5">
                    {grupo.map((item) => (
                      <li key={`${item.receitaId}-${item.indice}`}>
                        <label className="flex cursor-pointer items-start gap-2 text-sm text-stone-700 dark:text-stone-300">
                          <input
                            type="checkbox"
                            checked
                            onChange={() => removerItem(item.receitaId, item.indice)}
                            className="mt-0.5 h-4 w-4 shrink-0 accent-stone-900 dark:accent-stone-100"
                          />
                          <span>{item.ingrediente}</span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </main>
      <footer className="border-t border-stone-200 py-6 print:hidden dark:border-stone-800">
        <p className="px-4 text-center text-sm text-stone-500 dark:text-stone-400">
          <Link
            href="/"
            className="underline decoration-stone-300 underline-offset-2 hover:text-stone-700 dark:decoration-stone-700 dark:hover:text-stone-200"
          >
            Voltar às receitas
          </Link>
        </p>
      </footer>
    </div>
  );
}
