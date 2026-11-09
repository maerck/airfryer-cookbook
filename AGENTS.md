# AGENTS.md — airfryer-cookbook

Any coding assistant working in this repo MUST read this first. Plain, portable markdown.

**Repo:** `maerck/airfryer-cookbook` · https://github.com/maerck/airfryer-cookbook

<!-- Scaffolded from agent-framework/templates/AGENTS.md.plugin — plugin mode (mode 3):
     playbooks and personas come from the installed `agent-framework` plugin;
     project-local files below override them (resolution order in framework §0.1). -->

## 2. What this is

**200 Receitas · Air Fryer & Vapor** — a single-page Next.js recipe explorer (all UI copy in
European Portuguese) with 200 recipes for the Xiaomi Mijia Smart Steam Air Fryer 7 L.
The dataset lives in `data/recipes.json` and is immutable content. Personal project of Tiago.

## 3. Source of truth & plan

`PLAN.md` is the authoritative spec and the living plan. On conflict: **PLAN.md wins** —
fix this file and report the conflict.

## 4. Stack

Fixed stack — do not substitute:

- Node 22+ (`engines.node: ">=22"`), TypeScript `^5.9.3` strict, ESM
- Next.js `^16.4.3` (App Router) + React `^19.3.1`, Tailwind CSS `^4.3.3`, `lucide-react`,
  `next-themes` `^0.4.6` (dark mode, M3)
- pnpm `10.34.9` exact (`packageManager`), one committed `pnpm-lock.yaml`
- Vitest `^5.0.5` (only test runner), Biome `^2.6.4` (lint/format), zod `^4.6.7` at trust boundaries
- No backend, no database, no auth; persistence via `localStorage` only
- Note: the handoff's acceptance criteria additionally require `npm install && npm run dev`
  to run clean — verified with npm, but pnpm remains the committed package manager
  (`package-lock.json` is gitignored)

## 5. Workspace layout

| Path                 | Purpose                                                                                                                                                                                                                                                                                                      |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `data/recipes.json`  | Immutable dataset — 200 validated recipes (never edit content)                                                                                                                                                                                                                                               |
| `data/modelos.json`  | Immutable dataset — airfryer models (never edit content); the active model id lives in `localStorage`                                                                                                                                                                                                        |
| `lib/constants.ts`   | Fonte única das enumerações (`METODOS`, `CATEGORIAS`, `DIFICULDADES`, `ORDENS`) + tipos derivados e constantes de apresentação; não importa os datasets — componentes cliente que não precisam das receitas importam daqui                                                                                   |
| `lib/types.ts`       | `Receita`, `Metodo`, `Categoria`, `Dificuldade`, `ModeloAirfryer`, `AjusteModelo` types                                                                                                                                                                                                                      |
| `lib/site.ts`        | `SITE_URL` (`NEXT_PUBLIC_SITE_URL` → domínio de produção da Vercel → localhost) para sitemap/robots/Open Graph                                                                                                                                                                                               |
| `lib/schemas.ts`     | zod schemas + `validarReceitas`/`validarModelos` (reutilizados por `lib/data.ts`, `lib/models.ts` e `scripts/check-data.ts`)                                                                                                                                                                                 |
| `lib/data.ts`        | zod-validated import of `recipes.json` + derived constants (METODOS, DIFICULDADES, CORES_CAT, counts)                                                                                                                                                                                                        |
| `lib/models.ts`      | zod-validated import of `modelos.json` + `MODELOS`/`MODELO_PADRAO`/`encontrarModelo` + per-model recipe adjustment (`ajustarTemperatura`, `aplicarAjusteModelo`)                                                                                                                                             |
| `lib/filters.ts`     | Pure filter/search/sort logic + URL param (de)serialization (unit-tested)                                                                                                                                                                                                                                    |
| `lib/webmcp.ts`      | WebMCP: ferramentas só de leitura (`search_recipes`, `get_recipe`, `suggest_recipes`, `list_filters`) registadas em `document.modelContext` (spec atual) ou `navigator.modelContext` (legado) — só cliente, sem backend                                                                                      |
| `lib/suggest.ts`     | "Tenho em casa": unique-ingredient list, coverage scoring, suggestion sort (unit-tested)                                                                                                                                                                                                                     |
| `lib/shopping.ts`    | Shopping-list aggregation of checked ingredients (unit-tested)                                                                                                                                                                                                                                               |
| `lib/storage.ts`     | `localStorage`: favorites, checked ingredients, active model id                                                                                                                                                                                                                                              |
| `app/`               | App Router: `layout.tsx`, `page.tsx` (client explorer at `/`), `modelos/page.tsx`, `lista-compras/page.tsx`, `receita/[id]/page.tsx` (SSG, printable), `not-found.tsx`, `globals.css`, `error.tsx`, `loading.tsx`, `icon.svg`, `sitemap.ts`, `robots.ts`, `opengraph-image.tsx` (metadata files, not routes) |
| `components/`        | `Header.tsx`, `HeaderNav.tsx`, `FilterBar.tsx`, `RecipeCard.tsx`, `EmptyState.tsx`, `ErrorBoundary.tsx`, `ModelosClient.tsx`, `ModelCard.tsx`, `ListaComprasClient.tsx`, `ReceitaDetalhe.tsx`, `ThemeProvider.tsx`, `ThemeToggle.tsx`, `WebMCPTools.tsx`                                                     |
| `scripts/`           | `check-data.ts` — valida `data/*.json` contra `lib/schemas.ts` (`pnpm check:data`)                                                                                                                                                                                                                           |
| `__tests__/`         | Vitest suite (structural data tests + filter logic + model adjustment + suggest/shopping/SSR)                                                                                                                                                                                                                |
| `.github/workflows/` | `ci.yml` — CI canónica do framework (lint → typecheck → test → build → check:data)                                                                                                                                                                                                                           |
| root                 | `README.md` (runbook incl. atualização de dados), `LICENSE` (MIT), `PLAN.md`                                                                                                                                                                                                                                 |

## 6. Commands

| Task             | Command                                                |
| ---------------- | ------------------------------------------------------ |
| Install          | `pnpm install` (npm also works — acceptance criterion) |
| Dev              | `pnpm dev` (`npm run dev` also verified)               |
| Production build | `pnpm build`                                           |
| Typecheck        | `pnpm exec tsc --noEmit`                               |
| Tests            | `pnpm test` (Vitest, run mode)                         |
| Check data       | `pnpm check:data` (valida `data/*.json` + resumo)      |
| Lint/format      | `pnpm exec biome check --write .`                      |

## 7. Hard invariants (never violate)

1. `data/recipes.json` and `data/modelos.json` are immutable for agents: never rewrite, translate,
   reword or re-categorize a recipe, and never edit model entries — add a new model entry instead.
   The owner may replace the files wholesale (periodic re-upload, M5 in `PLAN.md`); agents only
   relax/validate the schemas in `lib/schemas.ts`, never the content. Datasets may grow beyond 200
   recipes (unique positive sequential ids); run `pnpm check:data` after any re-upload.
2. All UI copy stays in European Portuguese, verbatim per the strings in `PLAN.md` M1.
3. No `any` in TypeScript — typed filter state everywhere.
4. No backend, no database, no auth, no LLM/API calls; persistence via `localStorage` only.
   Routes: `/` (explorer), `/modelos`, `/lista-compras`, `/receita/[id]` (SSG) — M1/M2/M3 per
   `PLAN.md`. (`sitemap.ts`/`robots.ts`/`opengraph-image.tsx` are metadata files, not routes.)
   WebMCP (M7) is client-side read-only tool registration on `document.modelContext` (spec atual; `navigator.modelContext` legado) — not a
   backend; tools must stay read-only over the local dataset.
5. Recipe emojis come from the data as-is; `lucide-react` only for UI chrome icons.
6. Conventional commits; branch off `main`; commit only when asked.

## 8. Framework conformance

> This repo follows the Agent Framework via the `agent-framework` plugin
> (canonical copy: `https://github.com/maerck/agent-framework/blob/main/skills/agent-framework.md`).
> Tighten, never loosen — shadow an artifact locally, never edit the plugin.

## 9. Skills

Resolution: local `skills/<name>/SKILL.md` → plugin `agentFramework:<name>` →
canonical URL. Plugin skills are provided by the installed plugin; load them by
their namespaced name unless a local override exists.

| Skill                                  | Load when                              |
| -------------------------------------- | -------------------------------------- |
| `agentFramework:testing`               | Running or adding tests (Vitest)       |
| `agentFramework:toolchain-standards`   | Touching dependencies or lockfiles     |
| `agentFramework:dependency-management` | Bumping dependencies                   |
| `agentFramework:documentation`         | Writing or restructuring docs          |
| `agentFramework:cicd-framework`        | Creating/editing `.github/workflows/*` |
| `agentFramework:parallel-agents`       | Delegating work to a sub-agent         |

## 10. Agents (personas)

Resolution: `agents/<name>.md` (repo override) → plugin subagent
`agentFramework:<name>` → canonical URL. Thin wrappers live in
`.github/agents/<name>.agent.md`.

| Persona         | Role                                |
| --------------- | ----------------------------------- |
| `implementer`   | Feature implementation in this repo |
| `test-author`   | Writing Vitest suites               |
| `code-reviewer` | Read-only review of changes         |

## 11. Task routing

- Implementing a PLAN.md milestone → `implementer` persona + this AGENTS.md + PLAN.md
- Adding/running tests → load `agentFramework:testing`
- Dependency or lockfile changes → load `agentFramework:toolchain-standards` + `dependency-management`
- New `.github/workflows` files → load `agentFramework:cicd-framework`
- Delegating work to a sub-agent → `parallel-agents` playbook

## 12. Cross-repo

Standalone single repo (plugin mode) — no sibling-repo dependencies, no shared packages.
The framework itself resolves from the installed plugin; never vendor its files here.
