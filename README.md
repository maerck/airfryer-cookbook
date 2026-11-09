# 200 Receitas · Air Fryer & Vapor

Explorador de receitas (página única, pt-PT) para a **Xiaomi Mijia Smart Steam Air Fryer 7 L** —
ar quente, vapor e modo combinado. Sem backend, sem base de dados, sem contas: os favoritos, os
ingredientes marcados e o modelo ativo ficam em `localStorage`.

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

| Comando           | O que faz                                                  |
| ----------------- | ---------------------------------------------------------- |
| `pnpm dev`        | dev server (Turbopack)                                     |
| `pnpm build`      | build de produção                                          |
| `pnpm test`       | suite Vitest (`vitest run`)                                |
| `pnpm typecheck`  | `tsc --noEmit`                                             |
| `pnpm lint`       | Biome (check)                                              |
| `pnpm check:data` | valida `data/*.json` contra os schemas e imprime um resumo |

## Atualizar os dados (re-upload periódico)

O dataset pode crescer além das 200 receitas iniciais. Contrato: `data/recipes.json` é um array
de receitas com `id` inteiro positivo, único e sequencial a partir de 1; `data/modelos.json` é um
array de modelos com `id` slug único. Tudo o resto é validado pelo zod (`lib/schemas.ts`).

1. Substitui `data/recipes.json` e/ou `data/modelos.json` pelos ficheiros novos.
2. `pnpm check:data` — falha (exit 1) se algo estiver inválido e imprime o resumo (totais por
   método/categoria/dificuldade).
3. `pnpm test && pnpm typecheck && pnpm lint` — os testes de dados são estruturais (não usam
   agregados hardcoded), por isso não precisam de edits quando o dataset muda.
4. Commit + push para `main` → a CI (`.github/workflows/ci.yml`) corre `lint`, `typecheck`,
   `test`, `build` e `check:data`; se tudo passar, o deploy segue.

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
data/           recipes.json + modelos.json (só o dono altera, por re-upload)
__tests__/      suite Vitest
```

Ver `PLAN.md` para o plano/spec e `AGENTS.md` para as regras do repositório.

## Licença

[MIT](LICENSE) — © 2026 Tiago Maerck. As receitas são conteúdo do autor; ver o aviso no rodapé da app.
