"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ThemeToggle from "@/components/ThemeToggle";
import { contarListaCompras } from "@/lib/shopping";
import { lerIngredientesMarcados, subscreverIngredientesMarcados } from "@/lib/storage";

/** Links do cabeçalho + contador de itens da lista de compras (só após hidratação). */
export default function HeaderNav() {
  const [itensLista, setItensLista] = useState(0);
  const [hidratado, setHidratado] = useState(false);

  useEffect(() => {
    const atualizar = () => setItensLista(contarListaCompras(lerIngredientesMarcados()));
    atualizar();
    setHidratado(true);
    return subscreverIngredientesMarcados(atualizar);
  }, []);

  return (
    <div className="flex shrink-0 items-center gap-2">
      <Link
        href="/lista-compras"
        className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-stone-100 transition-colors hover:bg-white/20"
      >
        🛒 Lista de compras
        {hidratado && itensLista > 0 && (
          <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-xs font-semibold text-stone-950">
            {itensLista}
          </span>
        )}
      </Link>
      <Link
        href="/modelos"
        className="rounded-full bg-white/10 px-3 py-1.5 text-sm text-stone-100 transition-colors hover:bg-white/20"
      >
        🧺 Modelos
      </Link>
      <ThemeToggle />
    </div>
  );
}
