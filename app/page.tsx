"use client";

import { ChevronUp, UtensilsCrossed } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import EmptyState from "@/components/EmptyState";
import ErrorBoundary from "@/components/ErrorBoundary";
import FilterBar from "@/components/FilterBar";
import Header from "@/components/Header";
import RecipeCard from "@/components/RecipeCard";
import { contarPorMetodo, RECEITAS } from "@/lib/data";
import {
  type EstadoFiltroURL,
  estadoParaParams,
  filtrarReceitas,
  lerEstadoDeParams,
  normalizar,
} from "@/lib/filters";
import { encontrarModelo, MODELO_PADRAO } from "@/lib/models";
import {
  guardarFavoritas,
  guardarIngredientesMarcados,
  guardarModeloAtivoId,
  lerFavoritas,
  lerIngredientesMarcados,
  lerModeloAtivoId,
} from "@/lib/storage";
import {
  listarIngredientesUnicos,
  normalizarTenho,
  type Sugestao,
  sugerirReceitas,
} from "@/lib/suggest";
import type { ModeloAirfryer } from "@/lib/types";

export default function Page() {
  return (
    <ErrorBoundary>
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-stone-100 text-stone-500 dark:bg-stone-950 dark:text-stone-400">
            A carregar receitas…
          </div>
        }
      >
        <Explorer />
      </Suspense>
    </ErrorBoundary>
  );
}

function Explorer() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const estado = useMemo(() => lerEstadoDeParams(searchParams), [searchParams]);

  const [favoritas, setFavoritas] = useState<Set<number>>(new Set());
  const [marcados, setMarcados] = useState<Record<number, number[]>>({});
  const [expandidos, setExpandidos] = useState<Set<number>>(new Set());
  const [modelo, setModelo] = useState<ModeloAirfryer>(MODELO_PADRAO);
  const [hidratado, setHidratado] = useState(false);
  const [modoTenho, setModoTenho] = useState(false);
  const [tenho, setTenho] = useState<string[]>([]);
  const [soCompletas, setSoCompletas] = useState(false);
  const [limite, setLimite] = useState(24);
  const [mostrarTopo, setMostrarTopo] = useState(false);

  const chaveFiltro = JSON.stringify([estado, modoTenho]);
  const [ultimaChave, setUltimaChave] = useState(chaveFiltro);
  useEffect(() => {
    if (chaveFiltro !== ultimaChave) {
      setUltimaChave(chaveFiltro);
      setLimite(24);
    }
  }, [chaveFiltro, ultimaChave]);

  useEffect(() => {
    const aoTeclar = (e: KeyboardEvent) => {
      const alvo = e.target as HTMLElement | null;
      const aEscrever =
        alvo &&
        (alvo.tagName === "INPUT" ||
          alvo.tagName === "TEXTAREA" ||
          alvo.tagName === "SELECT" ||
          alvo.isContentEditable);
      if (e.key === "/" && !aEscrever) {
        e.preventDefault();
        document.getElementById("campo-pesquisa")?.focus();
      }
    };
    const aoRolar = () => setMostrarTopo(window.scrollY > 600);
    window.addEventListener("keydown", aoTeclar);
    window.addEventListener("scroll", aoRolar, { passive: true });
    aoRolar();
    return () => {
      window.removeEventListener("keydown", aoTeclar);
      window.removeEventListener("scroll", aoRolar);
    };
  }, []);

  useEffect(() => {
    setFavoritas(lerFavoritas());
    setMarcados(lerIngredientesMarcados());
    setModelo(encontrarModelo(lerModeloAtivoId()));
    setHidratado(true);
  }, []);

  useEffect(() => {
    if (hidratado) guardarFavoritas(favoritas);
  }, [favoritas, hidratado]);

  useEffect(() => {
    if (hidratado) guardarIngredientesMarcados(marcados);
  }, [marcados, hidratado]);

  useEffect(() => {
    if (hidratado) guardarModeloAtivoId(modelo.id);
  }, [modelo, hidratado]);

  const atualizarEstado = useCallback(
    (patch: Partial<EstadoFiltroURL>) => {
      const novo = { ...estado, ...patch };
      const params = new URLSearchParams();
      for (const [chave, valor] of Object.entries(estadoParaParams(novo))) {
        params.set(chave, valor);
      }
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [estado, pathname, router],
  );

  const limparFiltros = useCallback(() => {
    router.replace(pathname, { scroll: false });
  }, [pathname, router]);

  const contagemMetodos = useMemo(() => contarPorMetodo(), []);

  const filtradas = useMemo(
    () => filtrarReceitas(RECEITAS, { ...estado, favoritas }),
    [estado, favoritas],
  );

  const ingredientesDisponiveis = useMemo(() => listarIngredientesUnicos(RECEITAS), []);

  const tenhoNormalizado = useMemo(() => normalizarTenho(tenho), [tenho]);

  const sugestoes = useMemo<Sugestao[]>(
    () => (modoTenho ? sugerirReceitas(filtradas, tenhoNormalizado, soCompletas) : []),
    [modoTenho, filtradas, tenhoNormalizado, soCompletas],
  );

  const base = useMemo(
    () =>
      modoTenho
        ? sugestoes.map((s) => ({ receita: s.receita, sugestao: s }))
        : filtradas.map((receita) => ({ receita, sugestao: undefined })),
    [modoTenho, sugestoes, filtradas],
  );

  const visualizacao = useMemo(() => base.slice(0, limite), [base, limite]);

  const adicionarTenho = useCallback((item: string) => {
    const norm = normalizar(item.trim());
    if (norm === "") return;
    setTenho((prev) => (prev.some((p) => normalizar(p) === norm) ? prev : [...prev, item.trim()]));
  }, []);

  const removerTenho = useCallback((item: string) => {
    setTenho((prev) => prev.filter((p) => p !== item));
  }, []);

  const toggleExpand = useCallback((id: number) => {
    setExpandidos((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }, []);

  const toggleFavorita = useCallback((id: number) => {
    setFavoritas((prev) => {
      const novo = new Set(prev);
      if (novo.has(id)) novo.delete(id);
      else novo.add(id);
      return novo;
    });
  }, []);

  const toggleIngrediente = useCallback((receitaId: number, indice: number) => {
    setMarcados((prev) => {
      const atuais = new Set(prev[receitaId] ?? []);
      if (atuais.has(indice)) atuais.delete(indice);
      else atuais.add(indice);
      const novo = { ...prev };
      if (atuais.size === 0) delete novo[receitaId];
      else novo[receitaId] = [...atuais].sort((a, b) => a - b);
      return novo;
    });
  }, []);

  const surpreendeMe = useCallback(() => {
    if (base.length === 0) return;
    const sorteada = base[Math.floor(Math.random() * base.length)];
    if (!sorteada) return;
    setExpandidos((prev) => new Set(prev).add(sorteada.receita.id));
    setLimite((l) => Math.max(l, base.length));
    window.setTimeout(() => {
      document
        .getElementById(`receita-${sorteada.receita.id}`)
        ?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, [base]);

  return (
    <div className="min-h-screen">
      <Header modelo={modelo} />
      <FilterBar
        estado={estado}
        onEstadoChange={atualizarEstado}
        contagemMetodos={contagemMetodos}
        totalFavoritas={favoritas.size}
        aMostrar={visualizacao.length}
        onSurpreendeMe={surpreendeMe}
        modoTenho={modoTenho}
        onToggleModoTenho={() => setModoTenho((v) => !v)}
        tenho={tenho}
        onAdicionarTenho={adicionarTenho}
        onRemoverTenho={removerTenho}
        soCompletas={soCompletas}
        onToggleSoCompletas={() => setSoCompletas((v) => !v)}
        ingredientesDisponiveis={ingredientesDisponiveis}
      />
      <main className="mx-auto max-w-6xl px-4 py-6">
        {visualizacao.length === 0 ? (
          <div className="grid gap-4">
            <EmptyState onLimpar={limparFiltros} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {visualizacao.map(({ receita, sugestao }) => (
                <RecipeCard
                  key={receita.id}
                  receita={receita}
                  modelo={modelo}
                  expandida={expandidos.has(receita.id)}
                  onToggleExpand={toggleExpand}
                  favorita={favoritas.has(receita.id)}
                  onToggleFavorita={toggleFavorita}
                  marcados={marcados[receita.id] ?? []}
                  onToggleIngrediente={toggleIngrediente}
                  cobertura={
                    sugestao ? { cobertos: sugestao.cobertos, total: sugestao.total } : undefined
                  }
                />
              ))}
            </div>
            {base.length > visualizacao.length && (
              <div className="mt-6 flex justify-center">
                <button
                  type="button"
                  onClick={() => setLimite((l) => l + 24)}
                  className="rounded-full border border-stone-200 bg-white px-4 py-2 text-sm font-medium text-stone-700 transition-colors hover:border-stone-400 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:border-stone-500"
                >
                  Mostrar mais ({base.length - visualizacao.length} restantes)
                </button>
              </div>
            )}
          </>
        )}
      </main>
      {mostrarTopo && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          aria-label="Voltar ao topo"
          className="fixed bottom-6 right-6 z-30 rounded-full bg-stone-900 p-3 text-white shadow-lg transition-colors hover:bg-stone-700 dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-300"
        >
          <ChevronUp className="h-5 w-5" aria-hidden />
        </button>
      )}
      <footer className="border-t border-stone-200 py-6 dark:border-stone-800">
        <p className="flex items-center justify-center gap-1.5 px-4 text-center text-sm text-stone-500 dark:text-stone-400">
          <UtensilsCrossed className="h-4 w-4" aria-hidden />
          Boas cozinhas, Tiago! 🍽 · Receitas recolhidas e adaptadas para ar quente + vapor
        </p>
      </footer>
    </div>
  );
}
