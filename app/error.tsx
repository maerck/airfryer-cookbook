"use client";

import { AlertTriangle, RotateCcw } from "lucide-react";
import { useEffect } from "react";

export default function ErrorPage({
  error: erro,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(erro);
  }, [erro]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-100 px-6 text-center dark:bg-stone-950">
      <AlertTriangle className="h-8 w-8 text-amber-600" aria-hidden />
      <p className="text-lg text-stone-700 dark:text-stone-200">
        🥲 Não foi possível carregar a página.
      </p>
      <button
        type="button"
        onClick={reset}
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        <RotateCcw className="h-4 w-4" aria-hidden /> Tentar novamente
      </button>
    </div>
  );
}
