/** Grelha de placeholders (24 cards) usada no carregamento inicial da home. */
export default function ReceitasSkeleton() {
  return (
    <div className="min-h-screen bg-stone-100 dark:bg-stone-950" aria-hidden>
      <span className="sr-only">A carregar receitas…</span>
      <div className="mx-auto max-w-6xl px-4 py-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 24 }, (_, i) => (
            <div
              key={i}
              className="animate-pulse rounded-2xl border border-stone-200 bg-white p-4 dark:border-stone-800 dark:bg-stone-900"
            >
              <div className="flex items-start gap-3">
                <div className="h-8 w-8 rounded-full bg-stone-200 dark:bg-stone-800" />
                <div className="h-4 flex-1 rounded bg-stone-200 dark:bg-stone-800" />
              </div>
              <div className="mt-3 flex gap-1.5">
                <div className="h-5 w-16 rounded-full bg-stone-200 dark:bg-stone-800" />
                <div className="h-5 w-20 rounded-full bg-stone-200 dark:bg-stone-800" />
                <div className="h-5 w-14 rounded-full bg-stone-200 dark:bg-stone-800" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
