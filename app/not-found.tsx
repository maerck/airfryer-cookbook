import Link from "next/link";
import { TOTAL_RECEITAS } from "@/lib/data";

export default function NotFound() {
  return (
    <main
      id="conteudo"
      className="flex min-h-screen flex-col items-center justify-center gap-3 bg-stone-100 px-6 text-center dark:bg-stone-950"
    >
      <p className="text-6xl" aria-hidden>
        🥲
      </p>
      <h1 className="text-lg text-stone-700 dark:text-stone-200">Página não encontrada.</h1>
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 rounded-full bg-stone-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
      >
        Voltar às {TOTAL_RECEITAS} receitas
      </Link>
    </main>
  );
}
