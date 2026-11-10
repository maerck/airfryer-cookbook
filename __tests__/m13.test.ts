import { describe, expect, it } from "vitest";
import { atribuicaoDaReceita, RECEITAS } from "@/lib/data";
import { validarFontes, validarReceitas } from "@/lib/schemas";
import type { Fonte, Receita } from "@/lib/types";
import {
  adaptarCandidato,
  type Candidato,
  criarFetchLimitado,
  eDuplicado,
  executarPipeline,
  extrairCandidatos,
  MAX_RECEITAS_POR_EXECUCAO,
  montarReceita,
  montarResumo,
  normalizarNome,
  type ReceitaAdaptada,
  reverReceita,
  semelhancaIngredientes,
  USER_AGENT,
} from "@/scripts/atualizar-receitas.ts";
import { criarProvedorMistral, ENDPOINT_MISTRAL, estimarCustoEur } from "@/scripts/ia/mistral.ts";
import {
  LIMITE_PEDIDOS_POR_EXECUCAO,
  type ProvedorIA,
  USO_ZERO,
  type UsoIA,
  verificarLimites,
} from "@/scripts/ia/provedor.ts";

function fonteFake(patch: Partial<Fonte> = {}): Fonte {
  return {
    id: "fonte-teste",
    nome: "Fonte de Teste",
    url: "https://exemplo.pt/receitas",
    licenca: "CC BY-SA 4.0",
    ...patch,
  };
}

function candidatoFake(patch: Partial<Candidato> = {}): Candidato {
  return {
    nome: "Bacalhau no cesto",
    url: "https://exemplo.pt/receitas/bacalhau",
    ingredientes: ["2 postas de bacalhau", "azeite", "alho"],
    passos: ["Coloca no cesto", "Coze 12 min"],
    ...patch,
  };
}

function adaptadaFake(patch: Partial<ReceitaAdaptada> = {}): ReceitaAdaptada {
  return {
    nome: "Bacalhau no cesto",
    emoji: "🐟",
    metodo: "Air Fryer",
    cat: "Peixe & Marisco",
    tempo: 12,
    dificuldade: "Fácil",
    doses: 2,
    temp: "180°C",
    ingredientes: ["2 postas de bacalhau", "azeite", "alho"],
    passos: ["Coloca no cesto", "Coze a 180°C durante 12 min"],
    ...patch,
  };
}

/** Provedor falso: responde por matcher de conteúdo do prompt, sem rede. */
function provedorFalso(
  responder: (mensagens: { papel: string; conteudo: string }[]) => unknown,
): ProvedorIA & { usoPorModelo: Record<string, UsoIA> } {
  let uso: UsoIA = { ...USO_ZERO };
  const usoPorModelo: Record<string, UsoIA> = {};
  return {
    nome: "falso",
    usoPorModelo,
    get uso() {
      return { ...uso };
    },
    gerarJson: (mensagens, schema) => {
      uso = {
        pedidos: uso.pedidos + 1,
        tokensEntrada: uso.tokensEntrada + 100,
        tokensSaida: uso.tokensSaida + 50,
      };
      const bruto = responder(mensagens);
      const parsed = schema.safeParse(bruto);
      if (!parsed.success) throw new Error(`saída inválida: ${parsed.error.message}`);
      return Promise.resolve(parsed.data);
    },
  };
}

describe("data/fontes.json + schema de fontes (M13)", () => {
  it("aceita o registo vazio e fontes com licenças que permitem adaptação", () => {
    expect(validarFontes([])).toEqual([]);
    expect(validarFontes([fonteFake()])).toHaveLength(1);
    expect(validarFontes([fonteFake({ licenca: "CC0 1.0" })])).toHaveLength(1);
    expect(validarFontes([fonteFake({ licenca: "CC BY 4.0" })])).toHaveLength(1);
  });

  it("rejeita licenças que não permitem adaptação, URLs inválidos e ids duplicados", () => {
    expect(() => validarFontes([fonteFake({ licenca: "Todos os direitos reservados" })])).toThrow(
      /inválido/,
    );
    expect(() => validarFontes([fonteFake({ url: "não é url" })])).toThrow(/inválido/);
    expect(() => validarFontes([fonteFake(), fonteFake()])).toThrow(/duplicado/);
  });
});

describe("schema da receita com fonte (M13)", () => {
  it("as 200 receitas atuais não têm fonte (relaxação permitida)", () => {
    for (const r of RECEITAS) expect(r.fonte).toBeUndefined();
  });

  it("aceita receita com atribuição completa e rejeita url/licença inválidos", () => {
    const base = RECEITAS[0];
    if (!base) throw new Error("dataset vazio");
    const comFonte = validarReceitas([
      {
        ...base,
        fonte: {
          nome: "Fonte",
          url: "https://exemplo.pt/r",
          licenca: "CC BY 4.0",
          autores: ["Ana"],
        },
      },
    ]);
    expect(comFonte[0].fonte?.autores).toEqual(["Ana"]);
    expect(() =>
      validarReceitas([{ ...base, fonte: { nome: "F", url: "x", licenca: "CC0 1.0" } }]),
    ).toThrow(/inválido/);
  });

  it("atribuicaoDaReceita produz a string pt-PT registada", () => {
    const base = RECEITAS[0];
    if (!base) throw new Error("dataset vazio");
    expect(atribuicaoDaReceita(base)).toBeUndefined();
    const comFonte: Receita = {
      ...base,
      fonte: {
        nome: "Fonte X",
        url: "https://exemplo.pt/r",
        licenca: "CC BY-SA 4.0",
        autores: ["Ana", "Rui"],
      },
    };
    expect(atribuicaoDaReceita(comFonte)).toBe("Adaptado de Fonte X (CC BY-SA 4.0) — Ana, Rui");
    const semAutores: Receita = {
      ...base,
      fonte: { nome: "Fonte X", url: "https://exemplo.pt/r", licenca: "CC BY 4.0" },
    };
    expect(atribuicaoDaReceita(semAutores)).toBe("Adaptado de Fonte X (CC BY 4.0)");
  });
});

describe("dedupe (M13)", () => {
  it("normalizarNome ignora acentos, capitalização e pontuação", () => {
    expect(normalizarNome("  Bolo de Laranja! ")).toBe(normalizarNome("bolo de laranja"));
    expect(normalizarNome("Pão de Ló")).toBe("pao de lo");
  });

  it("semelhancaIngredientes é a fração de ingredientes comuns (sobre o maior conjunto)", () => {
    expect(semelhancaIngredientes(["a", "b"], ["a", "b"])).toBe(1);
    expect(semelhancaIngredientes(["a", "b"], ["a", "c"])).toBe(0.5);
    expect(semelhancaIngredientes([], ["a"])).toBe(0);
  });

  it("eDuplicado deteta nome igual (normalizado) ou ingredientes ≥ 70% comuns", () => {
    const existentes = RECEITAS.slice(0, 5);
    const primeiro = existentes[0];
    if (!primeiro) throw new Error("dataset vazio");
    expect(
      eDuplicado(existentes, {
        nome: primeiro.nome.toUpperCase(),
        ingredientes: primeiro.ingredientes,
      }),
    ).toBe(true);
    expect(
      eDuplicado(existentes, {
        nome: "Receita totalmente nova xyz",
        ingredientes: primeiro.ingredientes,
      }),
    ).toBe(true);
    expect(
      eDuplicado(existentes, {
        nome: "Receita totalmente nova xyz",
        ingredientes: ["agua", "sal", "farinha de outro planeta"],
      }),
    ).toBe(false);
  });
});

describe("pipeline com provedor e fontes simulados (sem rede)", () => {
  it("extrairCandidatos devolve a lista JSON do modelo", async () => {
    const provedor = provedorFalso(() => ({ candidatos: [candidatoFake()] }));
    const candidatos = await extrairCandidatos("texto qualquer", provedor);
    expect(candidatos).toHaveLength(1);
    expect(candidatos[0].nome).toBe("Bacalhau no cesto");
  });

  it("extrairCandidatos rejeita saída fora do schema", async () => {
    const provedor = provedorFalso(() => ({ candidatos: [{ nome: 42 }] }));
    await expect(extrairCandidatos("texto", provedor)).rejects.toThrow(/inválida/);
  });

  it("adaptarCandidato e reverReceita devolvem a receita adaptada validada", async () => {
    const provedor = provedorFalso(() => adaptadaFake());
    const adaptada = await adaptarCandidato(candidatoFake(), provedor);
    expect(adaptada.metodo).toBe("Air Fryer");
    const revista = await reverReceita(adaptada, provedor);
    expect(revista.nome).toBe("Bacalhau no cesto");
  });

  it("montarReceita atribui id sequencial e fonte (nome, url da receita, licença)", () => {
    const r = montarReceita(adaptadaFake(), candidatoFake(), fonteFake(), 201);
    expect(r.id).toBe(201);
    expect(r.fonte).toEqual({
      nome: "Fonte de Teste",
      url: "https://exemplo.pt/receitas/bacalhau",
      licenca: "CC BY-SA 4.0",
    });
  });

  it("executarPipeline: só acrescenta até N, ignora duplicados e não altera as existentes", async () => {
    const primeiro = RECEITAS[0];
    if (!primeiro) throw new Error("dataset vazio");
    const provedor = provedorFalso((mensagens) => {
      const texto = JSON.stringify(mensagens);
      if (texto.includes("candidatos")) {
        return {
          candidatos: [
            candidatoFake({ nome: primeiro.nome, url: "https://exemplo.pt/dup" }), // duplicado por nome
            candidatoFake(),
            candidatoFake({
              nome: "Outra nova",
              url: "https://exemplo.pt/outra",
              ingredientes: ["xyz novo", "abc novo"],
            }),
            candidatoFake({
              nome: "Mais uma",
              url: "https://exemplo.pt/mais",
              ingredientes: ["qq", "ww"],
            }),
          ],
        };
      }
      return adaptadaFake({ nome: "Bacalhau no cesto" });
    });
    const resultado = await executarPipeline({
      provedor,
      fetchTexto: () => Promise.resolve("<html>receitas</html>"),
      fontes: [fonteFake()],
      existentes: RECEITAS,
      maxNovas: MAX_RECEITAS_POR_EXECUCAO,
    });
    expect(resultado.novas.length).toBeLessThanOrEqual(MAX_RECEITAS_POR_EXECUCAO);
    expect(resultado.novas.length).toBe(3); // o duplicado do dataset foi descartado
    expect(resultado.novas.some((r) => r.nome === primeiro.nome)).toBe(false);
    const idsExistentes = new Set(RECEITAS.map((r) => r.id));
    for (const r of resultado.novas) expect(idsExistentes.has(r.id)).toBe(false);
    const idsNovos = resultado.novas.map((r) => r.id);
    expect(new Set(idsNovos).size).toBe(idsNovos.length);
    expect(Math.min(...idsNovos)).toBe(RECEITAS.length + 1);
    for (const r of resultado.novas) expect(r.fonte?.licenca).toBe("CC BY-SA 4.0");
  });

  it("executarPipeline: fonte inacessível é ignorada sem falhar a execução", async () => {
    const provedor = provedorFalso(() => ({ candidatos: [] }));
    const resultado = await executarPipeline({
      provedor,
      fetchTexto: () => Promise.reject(new Error("HTTP 500")),
      fontes: [fonteFake()],
      existentes: RECEITAS,
    });
    expect(resultado.novas).toEqual([]);
  });

  it("montarResumo inclui a checklist de segurança alimentar e o custo estimado", () => {
    const provedor = provedorFalso(() => ({}));
    const resumo = montarResumo(
      [montarReceita(adaptadaFake(), candidatoFake(), fonteFake(), 201)],
      provedor,
    );
    expect(resumo).toContain("Checklist de segurança alimentar");
    expect(resumo).toContain("74 °C");
    expect(resumo).toContain("#201");
    expect(resumo).toContain("custo estimado");
  });
});

describe("fetch limitado (M13)", () => {
  it("envia user-agent genérico e pára no limite de pedidos", async () => {
    const chamadas: { url: string; ua?: string }[] = [];
    const fetchFalso = (async (url: string | URL | Request, init?: RequestInit) => {
      chamadas.push({
        url: String(url),
        ua: new Headers(init?.headers).get("User-Agent") ?? undefined,
      });
      return new Response("texto", { status: 200 });
    }) as typeof fetch;
    const fetchTexto = criarFetchLimitado(fetchFalso, 2);
    await fetchTexto("https://exemplo.pt/a");
    await fetchTexto("https://exemplo.pt/b");
    expect(chamadas.every((c) => c.ua === USER_AGENT)).toBe(true);
    await expect(fetchTexto("https://exemplo.pt/c")).rejects.toThrow(/limite de pedidos/);
  });

  it("propaga erros HTTP", async () => {
    const fetchFalso = (async () => new Response("não", { status: 404 })) as typeof fetch;
    await expect(criarFetchLimitado(fetchFalso)("https://exemplo.pt/x")).rejects.toThrow(
      /HTTP 404/,
    );
  });
});

describe("provedor Mistral (fetch simulado, sem rede)", () => {
  function fetchComCorpo(corpo: unknown, status = 200): typeof fetch {
    return (async () =>
      new Response(JSON.stringify(corpo), {
        status,
        headers: { "Content-Type": "application/json" },
      })) as typeof fetch;
  }

  it("chama o endpoint UE com Bearer e devolve o JSON validado pelo schema", async () => {
    let pedido: { url: string; corpo: Record<string, unknown>; auth?: string } | undefined;
    const fetchFalso = (async (url: string | URL | Request, init?: RequestInit) => {
      pedido = {
        url: String(url),
        corpo: JSON.parse(String(init?.body)) as Record<string, unknown>,
        auth: new Headers(init?.headers).get("Authorization") ?? undefined,
      };
      return new Response(
        JSON.stringify({
          choices: [{ message: { content: JSON.stringify({ candidatos: [] }) } }],
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        }),
        { status: 200 },
      );
    }) as typeof fetch;
    const provedor = criarProvedorMistral("chave-teste", fetchFalso);
    const { z } = await import("zod");
    const saida = await provedor.gerarJson(
      [{ papel: "user", conteudo: "oi" }],
      z.object({ candidatos: z.array(z.unknown()) }),
    );
    expect(saida.candidatos).toEqual([]);
    expect(pedido?.url).toBe(ENDPOINT_MISTRAL);
    expect(pedido?.auth).toBe("Bearer chave-teste");
    const corpo = pedido?.corpo as { response_format: { type: string } };
    expect(corpo.response_format.type).toBe("json_object");
    expect(provedor.uso).toEqual({ pedidos: 1, tokensEntrada: 10, tokensSaida: 5 });
    expect(estimarCustoEur(provedor.usoPorModelo)).toBeGreaterThan(0);
  });

  it("rejeita HTTP de erro, JSON inválido e saída fora do schema", async () => {
    const { z } = await import("zod");
    const esquema = z.object({ ok: z.boolean() });
    const p1 = criarProvedorMistral("k", fetchComCorpo({ erro: 1 }, 500));
    await expect(p1.gerarJson([{ papel: "user", conteudo: "x" }], esquema)).rejects.toThrow(
      /HTTP 500/,
    );
    const p2 = criarProvedorMistral(
      "k",
      (async () =>
        new Response(
          JSON.stringify({ choices: [{ message: { content: "não é json" } }] }),
        )) as typeof fetch,
    );
    await expect(p2.gerarJson([{ papel: "user", conteudo: "x" }], esquema)).rejects.toThrow(/JSON/);
    const p3 = criarProvedorMistral(
      "k",
      fetchComCorpo({ choices: [{ message: { content: JSON.stringify({ ok: "sim" }) } }] }),
    );
    await expect(p3.gerarJson([{ papel: "user", conteudo: "x" }], esquema)).rejects.toThrow(
      /schema/,
    );
  });

  it("verificarLimites dispara ao exceder pedidos/tokens por execução", () => {
    expect(() => verificarLimites({ ...USO_ZERO })).not.toThrow();
    expect(() =>
      verificarLimites({
        pedidos: LIMITE_PEDIDOS_POR_EXECUCAO + 1,
        tokensEntrada: 0,
        tokensSaida: 0,
      }),
    ).toThrow(/custo/);
  });
});
