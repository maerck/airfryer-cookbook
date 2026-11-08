"use client";

import { RotateCcw } from "lucide-react";

interface EmptyStateProps {
  onLimpar: () => void;
}

export default function EmptyState({ onLimpar }: EmptyStateProps) {
  return (
    <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-dashed border-stone-300 bg-white/60 px-6 py-16 text-center dark:border-stone-700 dark:bg-stone-900/60">
      <p className="text-lg text-stone-600 dark:text-stone-300">🥲 Nenhuma receita encontrada.</p>
      <button
        type="button"
        onClick={onLimpar}
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        <RotateCcw className="h-4 w-4" aria-hidden /> Limpar filtros
      </button>
    </div>
  );
}
