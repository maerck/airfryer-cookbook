# airfryer-cookbook — Implementation Plan (handoff spec for the coding agent)

Target repo: **`maerck/airfryer-cookbook`** · base: `main` · goal: port the single-file React
prototype "200 Receitas · Air Fryer & Vapor" to a production Next.js app — a single-page
recipe explorer (pt-PT) for the Xiaomi Mijia Smart Steam Air Fryer 7 L, backed by the
immutable dataset `data/recipes.json` (200 recipes).

<!-- Scaffolded from agent-framework/templates/PLAN.md — format per agent-framework.md §4. -->

## Progress tracker

Updated at the end of every session (framework §4 session protocol).

| Milestone                                            | Status | Date       | Notes                                                                                                                                                                                                                       |
| ---------------------------------------------------- | ------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework install (plugin mode)                      | Done   | 2026-11-08 | `init-project.sh --mode plugin`; `check-framework.sh --root-only` 17/0 pass                                                                                                                                                 |
| M1 — Phase 1: Next.js port                           | Done   | 2026-11-08 | All tasks + acceptance criteria green: tsc clean, 24/24 vitest, next build OK, biome clean, framework 17/17                                                                                                                 |
| M2 — Modelos de airfryer                             | Done   | 2026-11-08 | `/modelos` + modelo ativo em localStorage + ajuste por modelo; 47/47 vitest, build OK, biome/tsc clean                                                                                                                      |
| M3 — Phase 2 ideas                                   | Done   | 2026-11-08 | `/receita/[id]` SSG (200 págs) + impressão, `/lista-compras`, dark mode (next-themes), modo "tenho em casa"; 64/64 vitest, build OK, biome/tsc clean, framework 17/17                                                       |
| Revisão pós-M3 (backlog M4–M6)                       | Done   | 2026-11-08 | IA/backend rejeitada pelo dono (sem backend, sem chaves); backlog de release pública + atualizações de dados + UX registado abaixo                                                                                          |
| M4 — Release pública                                 | Done   | 2026-11-08 | LICENSE MIT, README com runbook, CI `ci.yml`, sitemap/robots/OG image, metadataBase+OG; build OK                                                                                                                            |
| M5 — Atualização periódica dos dados                 | Done   | 2026-11-08 | schemas em `lib/schemas.ts` (dataset pode crescer), `pnpm check:data`, testes de dados estruturais, strings "200" Dinâmicas; 74/74 vitest                                                                                   |
| M6 — UX                                              | Done   | 2026-11-08 | ordem/dif/tempoMax, matching difuso "tenho em casa", renderização progressiva, checkboxes+⭐+prev/next em `/receita/[id]`, imprimir/copiar lista, badge no header, back-to-top, atalho "/"                                  |
| M7 — WebMCP (ferramentas p/ agentes de IA)           | Done   | 2026-11-08 | `lib/webmcp.ts` + `WebMCPTools.tsx` no layout: 4 ferramentas só de leitura em `document.modelContext`/`navigator.modelContext` (search_recipes, get_recipe, suggest_recipes, list_filters); no-op sem suporte; 86/86 vitest |
| M8 — UX da análise UI/UX (mobile/a11y/PWA/cook mode) | Done   | 2026-11-09 | Ver detalhes abaixo                                                                                                                                                                                                         |
| M9 — Ronda 3 de UX (skip link, limpar filtros, partilhar, doses) | Done   | 2026-11-09 | Ver detalhes abaixo |

## Milestones

### M1 — Phase 1: Next.js port of the prototype

Stack: Next.js 16 (App Router) + TypeScript + Tailwind CSS, single-page at `/`, data in
`data/recipes.json` typed via `lib/types.ts` + zod-validated in `lib/data.ts`,
`localStorage` persistence, `lucide-react` icons, all UI copy pt-PT verbatim.

#### Tasks

- [x] Install agent-framework (plugin mode) into the repo
- [x] Scaffold Next.js app (app/, components/, lib/, configs)
- [x] Header: gradient `from-stone-900 via-stone-800 to-amber-950`; title
  `200 Receitas · Air Fryer & Vapor`; subtitle
  `Concebidas para a Xiaomi Mijia Smart Steam Air Fryer 7 L`; spec chips
  `🔥 1800 W · ar quente`, `💨 900 W · vapor (depósito 1,5 L ≈ 90 min)`,
  `📚 +100 receitas na app Xiaomi Home`; small stone-400 disclaimer (times/temperatures are
  starting points; steam mode → heat-proof dish, never exceed max water line)
- [x] Sticky filter bar: search (placeholder `🔍 Procurar por nome ou ingrediente…`,
  case-insensitive over nome/cat/metodo/ingredientes), method chips with computed counts
  (`Todos (200)`, `🔥 Air Fryer (155)`, `💨 Vapor (30)`, `🔁 Combinação (15)`), five category
  toggle chips, `⭐ Só favoritas (n)` toggle, `⏱ Ordenar por tempo` toggle,
  `🎲 Surpreende-me` (random from filtered set → expand + smooth-scroll into view),
  counter `A mostrar <strong>{n}</strong> de 200 receitas`
- [x] Recipe cards: rounded-2xl white border-stone-200 hover shadow; header row
  (emoji, nome toggles expand, ☆/⭐ favorite, method/category/⏱ min/🎯 dificuldade badges);
  expanded two-column (stack on mobile): `🧺 Ingredientes` checkboxes with `x/y` progress +
  strikethrough, right column `🌡 {temp}` + `🍽 {doses}` badges, `👨‍🍳 Passos` numbered dark
  circles, `💡 Dica` amber-50 callout
- [x] Empty state: `🥲 Nenhuma receita encontrada.` + `Limpar filtros`
- [x] Footer: `Boas cozinhas, Tiago! 🍽 · Receitas recolhidas e adaptadas para ar quente + vapor`
- [x] localStorage persistence: favorites `Set<number>`, checked ingredients
  `Record<number, number[]>`; hydrate on mount, guard SSR
- [x] URL state sync via search params (q, metodo, cat, fav, ord) with `router.replace`
- [x] SEO: root metadata (title/description), `lang="pt"`, viewport, favicon; error/loading
  boundaries + graceful failure if the dataset fails validation
- [x] Vitest suite: aggregates (155/30/15; 45/41/44/32/38) + filter/search/sort logic

#### Acceptance criteria

- [x] `npm install && npm run dev` runs clean with no TS errors; `pnpm build` (production) passes
- [x] All 200 recipes render; method chips show `Todos (200)`, `Air Fryer (155)`, `Vapor (30)`, `Combinação (15)`
- [x] Search + method + category + favorites-only + sort-by-time + Surpreende-me all intersect correctly
- [x] Favorites and checked ingredients survive a page reload (localStorage)
- [x] Method filter Vapor → 30 results; Vapor + Ar → 15 results
- [x] Zero recipe content changes vs `data/recipes.json`; UI copy pt-PT exactly as specified above
- [x] `pnpm test` green; `biome check` clean; `check-framework.sh --root-only` green

### M2 — Modelos de airfryer (seleção + ajuste de receitas por modelo)

Generalize the appliance: a new immutable dataset `data/modelos.json` (zod-validated in
`lib/models.ts`, mirroring `lib/data.ts`) holding airfryer models — for now only the
**Xiaomi Mijia Smart Steam Air Fryer 7 L** (id `xiaomi-mijia-steam-airfryer-7l`), which is the
default/active model. Each model carries its specs (capacity, power, steam tank, autonomy) plus an
`ajuste` (`{ tempoMin, temperaturaC }` deltas) that is applied to every recipe's displayed time and
temperature via `aplicarAjusteModelo` / `ajustarTemperatura` (numeric `°C` values shifted, strings
like `Modo vapor` untouched; zero delta = identity). New section `/modelos` lists the models and
lets the user pick the active one (persisted in `localStorage` via `lib/storage.ts`, SSR-safe
hydration with the default model first). The main page header renders its subtitle/spec chips from
the active model (identical pt-PT strings for the default model) and links to `/modelos`; recipe
cards show the model-adjusted `⏱ tempo` / `🌡 temp` and an "ajustado ao modelo" badge only when the
active model's ajuste is non-zero. `data/recipes.json` stays untouched.

#### Tasks

- [x] `data/modelos.json` (Xiaomi Mijia Smart Steam Air Fryer 7 L) + `ModeloAirfryer`/`AjusteModelo` in `lib/types.ts`
- [x] `lib/models.ts`: zod validation, `MODELOS`, `MODELO_PADRAO`, `encontrarModelo`, `ajustarTemperatura`, `aplicarAjusteModelo`
- [x] `lib/storage.ts`: `lerModeloAtivoId` / `guardarModeloAtivoId`
- [x] Secção `/modelos` (`app/modelos/page.tsx` + `components/ModelosClient.tsx` + `components/ModelCard.tsx`): listar modelos, specs, selecionar modelo ativo
- [x] `Header.tsx`: link para `/modelos`; subtítulo e chips de specs a partir do modelo ativo
- [x] `app/page.tsx`: estado do modelo ativo (hidratação SSR-safe) passado ao Header e aos RecipeCard
- [x] `RecipeCard.tsx`: mostrar tempo/temp ajustados ao modelo; badge quando `ajuste ≠ 0`
- [x] `__tests__/models.test.ts` + `__tests__/ssr.test.ts`: dataset, `encontrarModelo`, `ajustarTemperatura` (incl. `Modo vapor` inalterado), `aplicarAjusteModelo` (identidade no modelo padrão, deltas, clamp de tempo), SSR do Header//modelos com as strings exatas de M1
- [x] `AGENTS.md` §5/§7 sincronizados com os novos ficheiros

#### Acceptance criteria

- [x] `tsc --noEmit` clean; `vitest run` green (incl. novos testes); `biome check` clean; `next build` passes; `check-framework.sh --root-only` 17/17
- [x] `/modelos` lista o Xiaomi Mijia Smart Steam Air Fryer 7 L como modelo ativo por defeito
- [x] Com o modelo por defeito, o header mostra exatamente as strings pt-PT de M1 (incl. `1,5 L` com vírgula decimal pt-PT)
- [x] `data/recipes.json` intocado; zero mudanças de conteúdo nas receitas
- [x] Seleção do modelo persiste em `localStorage` e sobrevive a reload (hidratação sem mismatch SSR)

### M3 — Phase 2 ideas (only after M2 is green)

#### Tasks

- [x] Per-recipe printable view `/receita/[id]` (`app/receita/[id]/page.tsx` + `components/ReceitaDetalhe.tsx`):
  `generateStaticParams` (200 págs SSG), `generateMetadata` por receita, `notFound()` para ids inválidos,
  botão Imprimir (`window.print()` + estilos `@media print`), link a partir de cada RecipeCard
- [x] Shopping list `/lista-compras` (`app/lista-compras/page.tsx` + `components/ListaComprasClient.tsx`):
  agrega os ingredientes marcados nas receitas (`lib/shopping.ts`), agrupados por receita, com
  remover item e limpar lista; link no Header
- [x] Dark mode via `next-themes` (`^0.4.6`): `ThemeProvider` (class strategy) no layout,
  `ThemeToggle` no Header, `@custom-variant dark` no globals.css e variantes `dark:` nos componentes
- [x] "O que tenho em casa" (`lib/suggest.ts` + modo no FilterBar/Explorer): o utilizador lista os
  ingredientes que tem (autocompletar com os ingredientes únicos do dataset) e as receitas são
  ordenadas por cobertura (rácio desc, tempo asc, id); toggle "Só receitas completas"; badge
  `🧺 x/y em casa` nos cards
- [x] `app/not-found.tsx` pt-PT; `receitaPorId`/`paramsReceitas` em `lib/data.ts`
- [x] Testes `__tests__/m3.test.ts` (suggest, shopping, helpers, SSR das novas páginas)
- [x] `AGENTS.md` §4/§5/§7 sincronizados; `biome.json` com `css.parser.tailwindDirectives`

#### Acceptance criteria

- [x] `tsc --noEmit` clean; `vitest run` 64/64; `biome check` clean; `next build` passa com
  `/receita/[id]` SSG (200 paths); `check-framework.sh --root-only` 17/17
- [x] Dev smoke: `/` mostra 200 cards, `/?metodo=Vapor` mostra 30, `/receita/1..200` OK,
  `/receita/999` → not-found pt-PT, `/lista-compras` e `/modelos` OK
- [x] `data/recipes.json` e `data/modelos.json` intocados; copy pt-PT; sem `any`; localStorage only

### M8 — Melhorias da análise UI/UX (2026-11-09, PR #1)

Segunda ronda da análise UI/UX (desktop + mobile, a11y, performance), depois do deploy de preview.

#### Tasks

- [x] Toolbar mobile em rails horizontais com scroll (`flex-nowrap overflow-x-auto` abaixo de `sm`); alvos de toque de 44px em chips/pesquisa/select/botões/ícones (`min-h-11`/`h-11 w-11`, compacto a partir de `sm`)
- [x] `aria-pressed` em todos os chips de filtro; `role="status"`/`aria-live="polite"` no contador "A mostrar N de 200"; emoji decorativos em `<span aria-hidden>`; opções do select "Ordenar:" sem emoji
- [x] Links compactos (ícone + badge) para `/lista-compras` e `/modelos` na barra fixa; hero compacto em mobile (`py-6 sm:py-10`); FAB voltar-ao-topo à esquerda em mobile
- [x] `theme-color` duplo via `media="(prefers-color-scheme: …)"`; anel `focus-visible` unificado (amber); guarda `prefers-reduced-motion` em `globals.css`
- [x] Esqueletos de grelha no carregamento (`components/ReceitasSkeleton.tsx`, usado no `Suspense` de `/` e em `loading.tsx`)
- [x] SEO: URL do sitemap à prova de barra final (`robots.ts`), `lastmod` removido do sitemap, canonical em `/` e `/receita/[id]`
- [x] PWA: `app/manifest.ts` (standalone, pt, ícone SVG) + `public/sw.js` (cache do shell, navegação network-first com fallback offline) + `components/RegisterSW.tsx` no layout
- [x] Modo cozinhar em `/receita/[id]`: passo a passo com texto grande, temporizador por passo (`lib/cook.ts`: `extrairMinutosDoPasso`/`formatarDuracao`), wake lock de ecrã (feature-detected), vibração ao terminar; strings pt-PT: "Modo cozinhar", "Passo X de Y", "Iniciar temporizador (N min)", "Cancelar temporizador", "Terminado!", "Anterior", "Seguinte", "Concluir", "Sair"
- [x] Hierarquia visual: chip de tempo em âmbar (mais forte) nos cards e no detalhe
- [x] Testes `__tests__/cook.test.ts` (extração de minutos incl. intervalos "10–12 min" e horas,Boundary do dataset real; formatação mm:ss/h:mm:ss)

#### Acceptance criteria

- [x] `vitest run` green (incl. `cook.test.ts`); `tsc --noEmit` e `biome check` limpos; `next build` OK (manifest + sw servidos)
- [x] Sem novas dependências; sem backend; persistência só em `localStorage`; dados intocados
- [x] CI do PR #1 verde (lint → typecheck → test → build → check:data) e preview Vercel OK

### M9 — Ronda 3 de UX (2026-11-09, depois do merge do PR #1)

#### Tasks

- [x] Skip link "Saltar para o conteúdo" no layout + `id="conteudo"` nos `<main>` de todas as rotas
- [x] Chip "Limpar filtros" (âmbar) na barra fixa quando há filtros ativos (`FilterBar` + `onLimparFiltros`)
- [x] Botão "Partilhar" em `/receita/[id]` (`navigator.share` com fallback para clipboard + "Copiado!")
- [x] Doseador de doses em `/receita/[id]` (1–24 doses): `lib/doses.ts` escala só o número inicial do
  ingrediente (decimais pt-PT, frações "1/2", intervalos "2–3"); números no meio do texto ficam intactos
  (ex.: "cesto de 7 L"); strings pt-PT: "Ajustar doses", "Diminuir doses", "Aumentar doses", "N doses"
- [x] Testes `__tests__/doses.test.ts` (incl. invariantes sobre o dataset real)

#### Acceptance criteria

- [x] `vitest run` green; `tsc --noEmit` e `biome check` limpos; `next build` OK
- [x] Sem novas dependências; dados intocados; persistência só em `localStorage`

## Out of scope

- Backend, database, auth, user accounts (incl. no AI/LLM calls — decided 2026-11-08)
- Any change to `data/recipes.json` content by agents (owner may re-upload new dataset
  versions — see M5)
- Translating the UI out of pt-PT

## Backlog proposto (sessão 2026-11-08 — revisão para release pública + atualizações periódicas)

Decidido com o dono: sem IA/LLM (sem backend, sem chaves API — invariant nº4 mantém-se); o dataset
vai **crescer** além de 200; a atualização faz-se por **re-upload dos ficheiros JSON + push** (CI e
deploy apanham-no).Tudo isto foi implementado em M4–M6 abaixo.

### M4 — Release pública

#### Tasks

- [x] `LICENSE` (MIT, © 2026 Tiago Maerck) + `README.md` com runbook (correr, atualizar dados, deploy)
- [x] CI `.github/workflows/ci.yml` segundo `agentFramework:cicd-framework`: push/PR em `main`,
  `permissions: contents: read`, `pnpm install --frozen-lockfile`, depois `lint` → `typecheck` →
  `test` → `build` e, como extensão do repo, `pnpm check:data`
- [x] SEO público: `app/sitemap.ts` (uma entrada por rota, incl. `/receita/1..N`), `app/robots.ts`,
  `app/opengraph-image.tsx` (1200×630), `metadataBase` + Open Graph em `app/layout.tsx`
  (`NEXT_PUBLIC_SITE_URL` em produção)
- [x] Deploy documentado no README (Vercel; `NEXT_PUBLIC_SITE_URL`); sem analytics/tracking

#### Acceptance criteria

- [x] `next build` gera sitemap/robots/OG sem erros; `pnpm lint`/`typecheck`/`test` limpos
- [x] CI em todo push/PR para `main` barra uploads de dados inválidos

### M5 — Atualizações periódicas dos dados (re-upload a cada X dias)

#### Tasks

- [x] `lib/schemas.ts`: schemas zod partilhados + `validarReceitas`/`validarModelos` (ids únicos;
  `data.ts`/`models.ts` passam a usá-los). O dataset pode crescer: `id` inteiro positivo único
  (sem limite 200), array com `min(1)` — `TOTAL_RECEITAS` continua derivado
- [x] `scripts/check-data.ts` + `pnpm check:data`: valida ambos os JSON e imprime resumo
  (total, range de ids, contagens por método/categoria/dificuldade, modelos); exit 1 se inválido
- [x] Testes de dados estruturais em `__tests__/data.test.ts` (ids únicos/sequenciais, somas dos
  agregados = total, cobertura dos mapas de cores) + testes dos validadores (aceita 250
  receitas, rejeita duplicados/enums inválidos); `filters.test.ts`/`m3.test.ts` sem contagens
  hardcoded (usam `contarPorMetodo()`/`contarPorCategoria()`/`TOTAL_RECEITAS`)
- [x] Strings de UI com "200" hardcoded → dinâmicas via `TOTAL_RECEITAS` ("Ver as N receitas",
  "Voltar às N receitas"); o título "200 Receitas · …" fica como marca
- [x] CI corre `check:data` em todo push (M4)
- [x] AGENTS.md invariant nº1 anotado: o dono pode substituir os ficheiros por re-upload; agentes
  nunca alteram conteúdo

#### Acceptance criteria

- [x] `pnpm check:data` OK no dataset atual; `vitest run` 74/74; `tsc --noEmit` limpo
- [x] Re-upload simulado (250 receitas válidas) passa a validação; inválido falha com mensagem clara

### M6 — Melhorias de UX (da revisão live no Chrome/Playwright)

#### Tasks

- [x] Filtros: `ord` passa a `padrao|tempo|tempo-desc|nome|dificuldade` (select "Ordenar";
  `ord=1` legado mapeia para `tempo`), novos filtros `dif` (🎯 dificuldade) e `tmax` (⏱ ≤15/30/45/60 min)
  em `lib/filters.ts` + chips no `FilterBar`; testes de round-trip e ordenação
- [x] "Tenho em casa" com matching difuso: `contemTermo`/`ingredienteCoberto` em `lib/suggest.ts`
  (limites de palavra Unicode — "frango" cobre "1 frango pequeno", "sal" não casa com "salmão")
- [x] Home: renderização progressiva (24 cards + "Mostrar mais"), botão voltar ao topo,
  atalho "/" foca a pesquisa; "Surpreende-me" usa o conjunto filtrado completo
- [x] `/receita/[id]`: checkboxes de ingredientes (contador x/y), botão ⭐, navegação
  anterior/seguinte — tudo ligado às mesmas chaves `localStorage`
- [x] `/lista-compras`: botões Imprimir e "Copiar lista" (`textoListaCompras` em `lib/shopping.ts`)
- [x] Header: badge com nº de itens da lista de compras (`HeaderNav.tsx`, só após hidratação)
- [x] Strings pt-PT novas registadas neste plano (select "Ordenar:", chips 🎯/⏱ ≤N min,
  "Mostrar mais (X restantes)", "Voltar ao topo", "Copiar lista"/"Copiado!", "Imprimir")

#### Acceptance criteria

- [x] `vitest run` 74/74; `tsc --noEmit` e `biome check` limpos; `next build` OK
- [x] Smoke live (Playwright): home mostra 24 cards e "Mostrar mais"; filtros/ordenações por URL
  funcionam; `/receita/1` com checkboxes/⭐/prev-next; lista de compras com imprimir/copiar

### M7 — WebMCP: ferramentas de pesquisa para agentes de IA no navegador

Sem backend e sem chaves: o WebMCP expõe ferramentas **só de leitura** no próprio cliente via
`document.modelContext.registerTool` (API standard; funciona nativamente no Chrome/Edge com
WebMCP ativo, ou em qualquer navegador com o polyfill oficial carregado).

#### Tasks

- [x] `lib/webmcp.ts`: handlers puros + `FERRAMENTAS_WEBMCP` + `registrarFerramentasWebMCP()`
  (feature-detect; no-op sem `document.modelContext`/`navigator.modelContext`; devolve unregister)
- [x] Ferramentas (descrições pt-PT, `annotations.readOnlyHint: true`):
  `search_recipes` (q/metodo/cat/dificuldade/tempoMax/ordem, máx. 25 resultados),
  `get_recipe` (id → receita completa com passos e dica),
  `suggest_recipes` (ingredientes → top 10 por cobertura, matching difuso),
  `list_filters` (métodos/categorias/dificuldades com contagens)
- [x] `components/WebMCPTools.tsx` montado no `app/layout.tsx` (disponível em todas as páginas)
- [x] `__tests__/webmcp.test.ts`: handlers, validação/erros, registo com mock e unregister
- [x] README: secção WebMCP (como ativar no Chrome, polyfill noutros navegadores)
- [x] Fix pós-revisão: a API atual é `document.modelContext` (fallback `navigator.modelContext`); registo à prova de duplicados (StrictMode/HMR — `InvalidStateError: Duplicate tool name` eliminado); registerTool assíncrono suportado; verificado em Brave 157: `[webmcp] ferramentas registadas: …` sem erros de consola

#### Acceptance criteria

- [x] `vitest run` 86/86; `tsc --noEmit` e `biome check` limpos; `next build` OK
- [x] Smoke live: a página carrega sem erros de consola quando o navegador não tem WebMCP (`document/navigator.modelContext`); com WebMCP ativo (Brave 157), as 4 ferramentas registam sem erros (no-op);
  registo/execução verificados por testes com `modelContext` mock
- [x] Invariante nº4 intacta: sem backend, sem chaves, sem rotas novas — só cliente
