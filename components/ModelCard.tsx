import { Check } from "lucide-react";
import { ajusteDescricao, formatarNumero, temAjuste } from "@/lib/models";
import type { ModeloAirfryer } from "@/lib/types";

interface ModelCardProps {
  modelo: ModeloAirfryer;
  ativo: boolean;
  onSelecionar: (id: string) => void;
}

export default function ModelCard({ modelo, ativo, onSelecionar }: ModelCardProps) {
  return (
    <article
      className={`rounded-2xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md dark:bg-stone-900 ${
        ativo
          ? "border-amber-500 ring-2 ring-amber-200 dark:border-amber-700 dark:ring-amber-900"
          : "border-stone-200 dark:border-stone-800"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-400 dark:text-stone-500">
            {modelo.marca}
          </p>
          <h2 className="mt-0.5 text-lg font-semibold leading-snug text-stone-900 dark:text-stone-100">
            {modelo.nome}
          </h2>
        </div>
        {ativo && (
          <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            <Check className="h-3.5 w-3.5" aria-hidden /> Modelo ativo
          </span>
        )}
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 text-xs">
        <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-700 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
          🧺 {formatarNumero(modelo.capacidadeL)} L
        </span>
        <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950 dark:text-amber-200">
          🔥 {modelo.potenciaArQuenteW} W · ar quente
        </span>
        {modelo.potenciaVaporW !== null &&
          modelo.depositoAguaL !== null &&
          modelo.autonomiaVaporMin !== null && (
            <span className="rounded-full border border-sky-200 bg-sky-50 px-2 py-0.5 font-medium text-sky-800 dark:border-sky-900 dark:bg-sky-950 dark:text-sky-200">
              💨 {modelo.potenciaVaporW} W · vapor (depósito {formatarNumero(modelo.depositoAguaL)}{" "}
              L ≈ {modelo.autonomiaVaporMin} min)
            </span>
          )}
        {modelo.receitasAppFabricante !== null && (
          <span className="rounded-full border border-stone-200 bg-stone-50 px-2 py-0.5 text-stone-700 dark:border-stone-700 dark:bg-stone-800/60 dark:text-stone-300">
            📚 +{modelo.receitasAppFabricante} receitas na app {modelo.marca} Home
          </span>
        )}
      </div>
      <p className="mt-3 text-sm text-stone-600 dark:text-stone-400">
        ⚙️ Ajuste de receitas: <strong>{ajusteDescricao(modelo.ajuste)}</strong>
        {temAjuste(modelo) && " — aplicado aos tempos e temperaturas de todas as receitas"}
      </p>
      {modelo.notas && (
        <p className="mt-2 text-xs leading-relaxed text-stone-500 dark:text-stone-400">
          {modelo.notas}
        </p>
      )}
      <button
        type="button"
        onClick={() => onSelecionar(modelo.id)}
        disabled={ativo}
        className={`mt-4 inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors ${
          ativo
            ? "cursor-default bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500"
            : "bg-stone-900 text-white hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        }`}
      >
        {ativo ? "✓ Modelo ativo" : "Usar este modelo"}
      </button>
    </article>
  );
}
