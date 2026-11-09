# Changelog

Todas as alterações relevantes deste projeto ficam registadas neste ficheiro.

O formato segue o [Keep a Changelog](https://keepachangelog.com/pt-PT/1.1.0/) e o projeto usa
[Versionamento Semântico](https://semver.org/lang/pt-PT/).

## [Unreleased]

## [1.0.0] — 2026-11-09

Primeira versão pública: explorador de 200 receitas para a Xiaomi Mijia Smart Steam Air Fryer 7 L
(M1–M9).

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
- Ferramentas WebMCP só de leitura para agentes de IA no navegador (`search_recipes`,
  `get_recipe`, `suggest_recipes`, `list_filters`).
- Publicação: licença MIT, README com runbook, CI (lint, typecheck, test, build, check:data),
  `sitemap.xml`, `robots.txt`, imagem Open Graph e metadados canónicos.

### Alterado

- Home com cabeçalho e 24 receitas no HTML estático; dataset fora dos bundles de `/receita/[id]` e
  `/modelos`.

### Corrigido

- Contador de receitas mostra o total filtrado e o badge da lista de compras atualiza em direto.
- Tema escuro desligado na impressão; WebMCP volta a registar após `unregister`.
- "Tenho em casa" exige todos os componentes da linha, aceita "ou" e plurais.

[Unreleased]: https://github.com/maerck/airfryer-cookbook/compare/v1.0.0...HEAD
[1.0.0]: https://github.com/maerck/airfryer-cookbook/releases/tag/v1.0.0
