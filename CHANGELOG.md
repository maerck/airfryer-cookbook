# Changelog

Todas as alterações relevantes deste projeto ficam registadas neste ficheiro.

O formato segue o [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) e o projeto usa
[Versionamento Semântico](https://semver.org/).

## [Unreleased]

### Corrigido

- Endurecimento de segurança (revisão estática hermes-security, 5 achados baixos): ações da CI
  fixadas por commit SHA em vez de tags mutáveis (CWE-829); índices de ingredientes do
  `localStorage` validados contra o dataset em `lerIngredientesMarcados` (CWE-129) — ids
  desconhecidos, índices fora de `[0, length)` e duplicados são descartados; o service worker
  só cacheia navegações com resposta válida (`resposta.ok`, CWE-451) e a versão de cache passa
  a `v2` para despejar páginas de erro já cacheadas; `suggest_recipes` do WebMCP limita o input
  do agente a 30 itens de 80 caracteres (CWE-400/770), refletido no `inputSchema`; adicionados
  cabeçalhos de segurança (CSP, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy)
  via `headers()` no `next.config.ts` (CWE-693). Novos testes de regressão em
  `__tests__/storage.test.ts` e `__tests__/webmcp.test.ts`.

### Adicionado

- Testes automáticos de acessibilidade (M11): `axe-core` sobre o HTML SSR de `/`, `/modelos`,
  `/lista-compras`, `/receita/1` e da página 404 (ambiente jsdom no Vitest, só devDependencies),
  sem violações `serious`/`critical`/`moderate` por rota; `pnpm test:a11y` corre só estes testes.
- Testes de smoke por rota em Vitest (`__tests__/smoke.test.ts`): idioma/título/skip link de todas
  as rotas, contador "A mostrar N de N", 24 cards + "Mostrar mais" na home, ligações do cabeçalho
  e, em `/receita/1`, modo cozinhar e doseador.

### Corrigido

- Landmarks e nomes acessíveis (M11, detetados pelo axe): a barra de filtros passou a
  `<section aria-label="Filtros e pesquisa">`, a página 404 passou a ter `<main id="conteudo">`
  com `<h1>`, o select "Ordenar:" perdeu o `aria-label` redundante (o `<label>` já dá o nome) e o
  doseador de doses usa `<legend className="sr-only">Ajustar doses</legend>`.

## [1.0.0] - 2026-11-09

Primeira versão pública: explorador de 200 receitas para a Xiaomi Mijia Smart Steam Air Fryer 7 L
(M1–M9 e revisões de 2026-11-09).

### Adicionado

- Explorador de receitas em `/` (Next.js 16, App Router, Tailwind CSS 4) com pesquisa, filtros por
  método, categoria, dificuldade e tempo máximo, e ordenação; estado dos filtros na URL.
- Dataset imutável de 200 receitas (`data/recipes.json`) validado com zod, mais
  `pnpm check:data` para validar o dataset após cada atualização.
- Modelos de airfryer em `/modelos`: modelo ativo guardado em `localStorage` e ajuste de
  temperatura/tempo por modelo.
- Página de detalhe `/receita/[id]` (SSG, imprimível) com ingredientes marcáveis, favoritas,
  receita anterior/seguinte, botão "Partilhar" e doseador (1–24 doses).
- "Modo cozinhar" passo a passo com temporizador por passo, wake lock de ecrã e vibração.
- Lista de compras em `/lista-compras` (agregada a partir dos ingredientes marcados; imprimir e
  copiar) e modo "Tenho em casa" com correspondência difusa de ingredientes.
- Tema escuro (`next-themes`), PWA com modo offline (manifest + service worker) e esqueletos de
  carregamento.
- Acessibilidade e mobile: skip link, `aria-pressed`/`aria-live`, alvos de toque de 44 px, rails de
  filtros com scroll, `prefers-reduced-motion`.
- Filtro "⭐ Só favoritas" e favoritas nos cards, "🎲 Surpreende-me", renderização progressiva
  com "Mostrar mais", "Voltar ao topo", atalho "/" para a pesquisa e chip "Limpar filtros".
- Aviso em pt-PT junto dos passos quando o modelo ativo tem ajuste (os passos mostram os valores
  da receita original).
- Ferramentas WebMCP só de leitura para agentes de IA no navegador (`search_recipes`,
  `get_recipe`, `suggest_recipes`, `list_filters`).
- Publicação: licença MIT, README com runbook, CI (lint, typecheck, test, build, check:data),
  `sitemap.xml`, `robots.txt`, imagem Open Graph e metadados canónicos.

### Alterado

- Home com cabeçalho e 24 receitas no HTML estático; dataset fora dos bundles de `/receita/[id]` e
  `/modelos`.

### Corrigido

- Contador de receitas mostra o total filtrado e o badge da lista de compras atualiza em direto.
- Tema escuro desligado na impressão; WebMCP volta a registar após `unregister` e já não regista
  ferramentas em duplicado.
- Caracteres reais nas etiquetas da barra de filtros (em vez de escapes unicode literais, PR #4).
- Pesquisa com estado local e sincronização da URL com atraso.
- "Tenho em casa" exige todos os componentes da linha, aceita "ou" e plurais.

[Unreleased]: https://github.com/maerck/airfryer-cookbook/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/maerck/airfryer-cookbook/releases/tag/v1.0.0
