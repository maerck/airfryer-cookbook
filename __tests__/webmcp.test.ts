import { beforeEach, describe, expect, it } from "vitest";
import { contarPorCategoria, contarPorMetodo, RECEITAS, TOTAL_RECEITAS } from "@/lib/data";
import { correspondePesquisa } from "@/lib/filters";
import {
  executarFerramenta,
  FERRAMENTAS_WEBMCP,
  type ModelContextLike,
  registrarFerramentasWebMCP,
  type WebMCPResult,
  type WebMCPToolDef,
} from "@/lib/webmcp";

function json(resultado: WebMCPResult): Record<string, unknown> {
  expect(resultado.content[0]?.type).toBe("text");
  return JSON.parse(resultado.content[0]?.text ?? "{}") as Record<string, unknown>;
}

describe("WebMCP — search_recipes", () => {
  it("pesquisa por texto livre e limita a 25 resultados", () => {
    const r = json(executarFerramenta("search_recipes", { q: "frango" }));
    expect(r.total).toBeGreaterThan(0);
    const receitas = r.receitas as Array<Record<string, unknown>>;
    expect(receitas.length).toBeLessThanOrEqual(25);
    for (const rec of receitas) {
      const original = RECEITAS.find((x) => x.id === rec.id);
      expect(original).toBeDefined();
      if (original) expect(correspondePesquisa(original, "frango")).toBe(true);
    }
  });

  it("filtra por método, categoria, dificuldade e tempo máximo", () => {
    const r = json(
      executarFerramenta("search_recipes", {
        metodo: "Vapor",
        cat: "Doces",
        dificuldade: "Fácil",
        tempoMax: 60,
      }),
    );
    const receitas = r.receitas as Array<Record<string, unknown>>;
    for (const rec of receitas) {
      expect(rec.metodo).toBe("Vapor");
      expect(rec.cat).toBe("Doces");
      expect(rec.dificuldade).toBe("Fácil");
      expect(rec.tempo).toBeLessThanOrEqual(60);
    }
  });

  it("ordena por tempo quando ordem=tempo", () => {
    const r = json(executarFerramenta("search_recipes", { ordem: "tempo" }));
    const receitas = r.receitas as Array<{ tempo: number }>;
    for (let i = 1; i < receitas.length; i++) {
      expect(receitas[i]?.tempo ?? 0).toBeGreaterThanOrEqual(receitas[i - 1]?.tempo ?? 0);
    }
  });

  it("valores inválidos caem nos defaults; tempoMax inválido dá erro", () => {
    const r = json(executarFerramenta("search_recipes", { metodo: "Micro-ondas", q: "frango" }));
    expect(r.total).toBeGreaterThan(0); // metodo inválido → "Todos"
    const bad = executarFerramenta("search_recipes", { tempoMax: -5 });
    expect(bad.isError).toBe(true);
  });
});

describe("WebMCP — get_recipe", () => {
  it("devolve a receita completa com passos e dica", () => {
    const r = json(executarFerramenta("get_recipe", { id: 1 }));
    expect(r.nome).toBeTruthy();
    expect(Array.isArray(r.ingredientes)).toBe(true);
    expect(Array.isArray(r.passos)).toBe(true);
    expect((r.passos as unknown[]).length).toBeGreaterThan(0);
  });

  it("id inexistente ou inválido devolve erro", () => {
    expect(executarFerramenta("get_recipe", { id: TOTAL_RECEITAS + 1 }).isError).toBe(true);
    expect(executarFerramenta("get_recipe", { id: "abc" }).isError).toBe(true);
    expect(executarFerramenta("get_recipe", {}).isError).toBe(true);
  });
});

describe("WebMCP — suggest_recipes", () => {
  it("sugere por cobertura de ingredientes (matching difuso: 'frango')", () => {
    const r = json(executarFerramenta("suggest_recipes", { ingredientes: ["frango"] }));
    const sugestoes = r.sugestoes as Array<{
      id: number;
      cobertos: number;
      totalIngredientes: number;
    }>;
    expect(sugestoes.length).toBeGreaterThan(0);
    expect(sugestoes.length).toBeLessThanOrEqual(10);
    expect(sugestoes[0]?.cobertos).toBeGreaterThan(0);
    for (let i = 1; i < sugestoes.length; i++) {
      const a = sugestoes[i - 1];
      const b = sugestoes[i];
      if (a && b) {
        const ra = a.cobertos / a.totalIngredientes;
        const rb = b.cobertos / b.totalIngredientes;
        expect(ra).toBeGreaterThanOrEqual(rb);
      }
    }
  });

  it("array vazio dá erro", () => {
    expect(executarFerramenta("suggest_recipes", { ingredientes: [] }).isError).toBe(true);
  });
});

describe("WebMCP — list_filters", () => {
  it("devolve métodos/categorias com as contagens do dataset", () => {
    const r = json(executarFerramenta("list_filters", {}));
    expect(r.totalReceitas).toBe(TOTAL_RECEITAS);
    expect(r.metodos).toEqual(contarPorMetodo());
    expect(r.categorias).toEqual(contarPorCategoria());
  });
});

describe("WebMCP — registo", () => {
  beforeEach(() => {
    // limpa o dedupe global entre testes
    delete (globalThis as Record<string, unknown>).__webmcpFerramentasRegistadas;
  });

  it("registra as 4 ferramentas read-only e devolve unregister", () => {
    const registadas: WebMCPToolDef[] = [];
    const unregCalls: number[] = [];
    const mock: ModelContextLike = {
      registerTool: (t) => {
        registadas.push(t);
        return () => unregCalls.push(1);
      },
    };
    const unregister = registrarFerramentasWebMCP(mock);
    expect(registadas.map((t) => t.name)).toEqual([
      "search_recipes",
      "get_recipe",
      "suggest_recipes",
      "list_filters",
    ]);
    for (const t of registadas) {
      expect(t.annotations.readOnlyHint).toBe(true);
      expect(t.annotations.destructiveHint).toBe(false);
      expect(t.inputSchema.type).toBe("object");
    }
    unregister();
    expect(unregCalls).toHaveLength(4);
  });

  it("é no-op sem modelContext (navegador sem WebMCP)", () => {
    const unregister = registrarFerramentasWebMCP(undefined);
    expect(() => unregister()).not.toThrow();
  });

  it("prefere document.modelContext (spec atual) e cai para navigator.modelContext (legado)", () => {
    const docNomes: string[] = [];
    const navNomes: string[] = [];
    const docMC: ModelContextLike = {
      registerTool: (t) => {
        docNomes.push(t.name);
        return () => {};
      },
    };
    const navMC: ModelContextLike = {
      registerTool: (t) => {
        navNomes.push(t.name);
        return () => {};
      },
    };
    const g = globalThis as Record<string, unknown>;
    const docDesc = Object.getOwnPropertyDescriptor(globalThis, "document");
    const navDesc = Object.getOwnPropertyDescriptor(globalThis, "navigator");
    Object.defineProperty(globalThis, "document", {
      configurable: true,
      value: { modelContext: docMC },
    });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { modelContext: navMC },
    });
    try {
      const un = registrarFerramentasWebMCP();
      expect(docNomes).toHaveLength(4); // document.modelContext ganha
      expect(navNomes).toHaveLength(0);
      un();
    } finally {
      if (docDesc) Object.defineProperty(globalThis, "document", docDesc);
      else delete g.document;
      if (navDesc) Object.defineProperty(globalThis, "navigator", navDesc);
      else delete g.navigator;
    }

    // só com navigator.modelContext (legado) também regista
    delete (globalThis as Record<string, unknown>).__webmcpFerramentasRegistadas;
    Object.defineProperty(globalThis, "document", { configurable: true, value: {} });
    Object.defineProperty(globalThis, "navigator", {
      configurable: true,
      value: { modelContext: navMC },
    });
    try {
      const un2 = registrarFerramentasWebMCP();
      expect(navNomes).toHaveLength(4);
      un2();
    } finally {
      if (docDesc) Object.defineProperty(globalThis, "document", docDesc);
      else delete g.document;
      if (navDesc) Object.defineProperty(globalThis, "navigator", navDesc);
      else delete g.navigator;
    }
  });

  it("usa unregisterTool(name) quando registerTool não devolve função", () => {
    const removidos: string[] = [];
    const mock: ModelContextLike = {
      registerTool: () => undefined,
      unregisterTool: (name) => {
        removidos.push(name);
      },
    };
    const unregister = registrarFerramentasWebMCP(mock);
    unregister();
    expect(removidos).toEqual(["search_recipes", "get_recipe", "suggest_recipes", "list_filters"]);
  });

  it("as ferramentas registadas executam via execute", async () => {
    const r = await FERRAMENTAS_WEBMCP[1]?.execute({ id: 2 });
    expect(r?.isError).toBeFalsy();
    expect(json(r as WebMCPResult).id).toBe(2);
  });
});
