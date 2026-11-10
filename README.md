# 200 Receitas · Air Fryer & Vapor

Explorador de receitas (página única, pt-PT) para a **Xiaomi Mijia Smart Steam Air Fryer 7 L** —
ar quente, vapor e modo combinado. Sem backend, sem base de dados, sem contas: os favoritos, os
ingredientes marcados e o modelo ativo ficam em `localStorage`.

- **Produção:** https://airfryer-cookbook.vercel.app
- **App:** `/` (explorador) · `/modelos` · `/lista-compras` · `/receita/[id]` (SSG, imprimível)
- **Dados:** `data/recipes.json` (receitas) e `data/modelos.json` (modelos) — validados com zod
  em `lib/schemas.ts`

## Correr localmente

```bash
pnpm install        # ou: npm install
pnpm dev            # http://localhost:3000
```

Requer Node 22+. O gestor de pacotes commitado é o pnpm (`packageManager` em `package.json`).

## Scripts

| Comando           | O que faz                                                                           |
| ----------------- | ----------------------------------------------------------------------------------- |
| `pnpm dev`        | dev server (Turbopack)                                                              |
| `pnpm build`      | build de produção                                                                   |
| `pnpm test`       | suite Vitest (`vitest run`)                                                         |
| `pnpm test:a11y`  | só os testes de acessibilidade (axe) — `a11y.test.ts`                               |
| `pnpm typecheck`  | `tsc --noEmit`                                                                      |
| `pnpm lint`       | Biome (check)                                                                       |
| `pnpm check:data` | valida `data/*.json` + `data/recipes/` contra os schemas e imprime um resumo        |
| `pnpm data:build` | junta `data/recipes/*.json` → `data/recipes.json` (`--check` só verifica sincronia) |
| `pnpm data:split` | expande `data/recipes.json` → `data/recipes/<id>.json` (após re-upload)             |

## Testes

A suite (`pnpm test`, Vitest — o único test runner) cobre:

- **Dados e lógica pura** (`data`, `models`, `copy`, `site`, `filters`, `m3`, `cook`, `doses`,
  `webmcp`): validação estrutural dos datasets, filtros/ordenação/URL, ajuste por modelo,
  "tenho em casa", lista de compras, temporizador do modo cozinhar, doseador e ferramentas WebMCP.
- **SSR** (`ssr`, `m3`): componentes e páginas renderizados com `renderToString`.
- **Smoke por rota** (`__tests__/smoke.test.ts`): o HTML SSR de `/`, `/modelos`, `/lista-compras`,
  `/receita/1` e da página de erro tem idioma `pt`, `<title>` dos metadados da rota, skip link com
  alvo; a home mostra o contador "A mostrar N de N", os 24 cards iniciais + "Mostrar mais" e as
  ligações do cabeçalho; `/receita/1` mostra o modo cozinhar e o doseador.
- **Acessibilidade** (`__tests__/a11y.test.ts`): o axe-core corre sobre o HTML SSR de cada rota
  (ambiente jsdom) e o teste falha com qualquer violação `serious`/`critical` (e `moderate`).
  Corre só os de acessibilidade com `pnpm test:a11y`; um ficheiro só: `pnpm test __tests__/smoke.test.ts`.
  Nota: no jsdom não há folhas de estilo, por isso `color-contrast` fica "incomplete" (justificado
  no teste) — o contraste real vem das classes Tailwind.

As rotas são renderizadas para HTML por `__tests__/helpers/rotas.ts` (layout raiz + página, com
`next/link`/`next/navigation` mockados e o `<title>` lido dos metadados exportados).

## Atualizar os dados (re-upload periódico)

O dataset pode crescer além das 200 receitas iniciais. Contrato: cada receita vive em
`data/recipes/<id>.json` (um ficheiro por receita, nome = `id` inteiro positivo, único e
sequencial a partir de 1); `data/recipes.json` é o ficheiro **gerado** (via `pnpm data:build`) que
a app e os testes leem — nunca o edites à mão. `data/modelos.json` é um array de modelos com `id`
slug único. Tudo o resto é validado pelo zod (`lib/schemas.ts`).

Re-upload completo (o dono substitui o dataset inteiro por um `recipes.json` novo):

1. Substitui `data/recipes.json` e/ou `data/modelos.json` pelos ficheiros novos.
2. `pnpm data:split` — expande o `recipes.json` novo para `data/recipes/<id>.json`.
3. `pnpm check:data` — falha (exit 1) se algo estiver inválido e imprime o resumo (totais por
   método/categoria/dificuldade + contagem dos ficheiros por receita).
4. `pnpm test && pnpm typecheck && pnpm lint` — os testes de dados são estruturais (não usam
   agregados hardcoded), por isso não precisam de edits quando o dataset muda.
5. Commit + push para `main` → a CI (`.github/workflows/ci.yml`) corre `lint`, `typecheck`,
   `test`, `build`, `check:data` e `data:build --check` (falha se `data/recipes.json` e
   `data/recipes/` divergirem); se tudo passar, o deploy segue.

Para editar/adicionar apenas algumas receitas, altera os `data/recipes/<id>.json` respetivos e
corre `pnpm data:build` para regenerar o ficheiro combinado.

Os agentes nunca alteram o conteúdo dos ficheiros de dados — só o dono, por re-upload completo.

## Deploy (público)

Recomendado: **Vercel** (importar o repositório; deteta Next.js automaticamente; build
`pnpm build`). Definir a variável de ambiente `NEXT_PUBLIC_SITE_URL` com o URL de produção —
é usada no `sitemap.xml`, `robots.txt` e metadados Open Graph. Se faltar, na Vercel usa-se o
domínio de produção do projeto; fora da Vercel o build avisa e os URLs ficam em `localhost`.

Sem analytics nem tracking: o estado do utilizador vive apenas no `localStorage` do navegador.

## WebMCP — ferramentas para agentes de IA

A app expõe **4 ferramentas só de leitura** via [WebMCP](https://github.com/modelcontextprotocol/webmcp)
(`document.modelContext.registerTool` (spec atual; `navigator.modelContext` legado)), para que agentes de IA no navegador possam pesquisar as
receitas sem backend nem chaves:

| Ferramenta        | O que faz                                                                                                   |
| ----------------- | ----------------------------------------------------------------------------------------------------------- |
| `search_recipes`  | pesquisa por texto + filtros (`q`, `metodo`, `cat`, `dificuldade`, `tempoMax`, `ordem`), máx. 25 resultados |
| `get_recipe`      | receita completa (ingredientes, passos, dica) por `id`                                                      |
| `suggest_recipes` | top 10 receitas pela cobertura de uma lista de `ingredientes`                                               |
| `list_filters`    | métodos/categorias/dificuldades disponíveis com contagens                                                   |

O registo acontece em `components/WebMCPTools.tsx` (montado no layout) e é um no-op em navegadores
sem suporte. No Chrome/Edge com WebMCP ativo (nativo ou `chrome://flags`), as ferramentas ficam
disponíveis aos agentes; noutros navegadores basta carregar o polyfill oficial do WebMCP antes
do bundle — o código de registo (`lib/webmcp.ts`) funciona igual com ambos.

## Estrutura

```
app/            rotas App Router (+ sitemap.ts, robots.ts, opengraph-image.tsx)
components/     componentes de UI (Header, FilterBar, RecipeCard, …)
lib/            data.ts/models.ts (datasets validados), filters.ts, suggest.ts, shopping.ts,
                storage.ts, schemas.ts, types.ts, constants.ts (enumerações, fonte única), site.ts
scripts/        check-data.ts (validação dos datasets)
data/           recipes/<id>.json (uma receita por ficheiro) + recipes.json gerado + modelos.json (só o dono altera, por re-upload)
__tests__/      suite Vitest
```

Ver `PLAN.md` para o plano/spec e `AGENTS.md` para as regras do repositório.

## Releases

1. Em `CHANGELOG.md`, move o conteúdo de `[Unreleased]` para uma secção nova
   `[X.Y.Z] - AAAA-MM-DD` e atualiza as ligações no fim do ficheiro.
2. Atualiza `version` em `package.json` para `X.Y.Z`.
3. Abre um PR e faz merge para `main` (o repositório usa merge commits, não squash).
4. Espera que a CI esteja verde no merge commit em `main` — a tag só se cria num commit com CI
   verde — e cria a tag e o GitHub Release a partir dele, com as notas dessa versão extraídas do
   CHANGELOG para um ficheiro:

   ```bash
   gh release create vX.Y.Z --target main --title vX.Y.Z --notes-file <ficheiro com as notas da versão>
   ```

O Dependabot (`.github/dependabot.yml`) abre semanalmente PRs agrupados (minor + patch) para `npm` e
`github-actions`; majors do stack fixado nunca são propostos.

## Licença

[MIT](LICENSE) — © 2026 Tiago Maerck. As receitas são conteúdo do autor; ver o aviso no rodapé da app.
