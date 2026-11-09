"use client";

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import ModelCard from "@/components/ModelCard";

import { encontrarModelo, MODELO_PADRAO, MODELOS } from "@/lib/models";
import { guardarModeloAtivoId, lerModeloAtivoId } from "@/lib/storage";

export default function ModelosClient({ totalReceitas }: { totalReceitas: number }) {
  const [modeloAtivoId, setModeloAtivoId] = useState<string>(MODELO_PADRAO.id);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    setModeloAtivoId(encontrarModelo(lerModeloAtivoId()).id);
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (hidratado) guardarModeloAtivoId(modeloAtivoId);
  }, [modeloAtivoId, hidratado]);

  return (
    <div className="min-h-screen">
      <header className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white">
        <div className="mx-auto max-w-6xl px-4 py-10">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-stone-300 transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden /> Voltar às receitas
          </Link>
          <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Modelos de airfryer
          </h1>
          <p className="mt-2 max-w-2xl text-stone-300">
            Escolhe o modelo ativo: os tempos e temperaturas das receitas são ajustados a esse
            equipamento.
          </p>
          <p className="mt-4 text-sm text-stone-400">
            {MODELOS.length === 1 ? "1 modelo disponível" : `${MODELOS.length} modelos disponíveis`}
          </p>
        </div>
      </header>
      <main id="conteudo" className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODELOS.map((m) => (
            <ModelCard
              key={m.id}
              modelo={m}
              ativo={m.id === modeloAtivoId}
              onSelecionar={setModeloAtivoId}
            />
          ))}
        </div>
      </main>
      <footer className="border-t border-stone-200 py-6 dark:border-stone-800">
        <p className="px-4 text-center text-sm text-stone-500 dark:text-stone-400">
          <Link
            href="/"
            className="underline decoration-stone-300 underline-offset-2 hover:text-stone-700 dark:decoration-stone-700 dark:hover:text-stone-200"
          >
            Ver as {totalReceitas} receitas
          </Link>{" "}
          ajustadas ao modelo ativo.
        </p>
      </footer>
    </div>
  );
}
