import { Info } from "lucide-react";
import HeaderNav from "@/components/HeaderNav";
import { formatarNumero } from "@/lib/models";
import type { ModeloAirfryer } from "@/lib/types";

interface HeaderProps {
  modelo: ModeloAirfryer;
}

export default function Header({ modelo }: HeaderProps) {
  return (
    <header className="bg-gradient-to-br from-stone-900 via-stone-800 to-amber-950 text-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="flex items-start justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            200 Receitas · Air Fryer &amp; Vapor
          </h1>
          <HeaderNav />
        </div>
        <p className="mt-2 text-stone-300">
          Concebidas para a {modelo.marca} {modelo.nome}
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          <span className="rounded-full bg-white/10 px-3 py-1">
            🔥 {modelo.potenciaArQuenteW} W · ar quente
          </span>
          {modelo.potenciaVaporW !== null &&
            modelo.depositoAguaL !== null &&
            modelo.autonomiaVaporMin !== null && (
              <span className="rounded-full bg-white/10 px-3 py-1">
                💨 {modelo.potenciaVaporW} W · vapor (depósito{" "}
                {formatarNumero(modelo.depositoAguaL)} L ≈ {modelo.autonomiaVaporMin} min)
              </span>
            )}
          {modelo.receitasAppFabricante !== null && (
            <span className="rounded-full bg-white/10 px-3 py-1">
              📚 +{modelo.receitasAppFabricante} receitas na app {modelo.marca} Home
            </span>
          )}
        </div>
        <p className="mt-4 flex max-w-3xl items-start gap-2 text-xs leading-relaxed text-stone-400">
          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          <span>
            Os tempos e temperaturas são pontos de partida — ajusta ao teu gosto e ao tamanho das
            doses. No modo vapor, usa sempre um recipiente resistente ao calor e nunca ultrapasses o
            nível máximo de água do depósito.
          </span>
        </p>
      </div>
    </header>
  );
}
