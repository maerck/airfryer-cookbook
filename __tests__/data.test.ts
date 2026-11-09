import { describe, expect, it } from "vitest";
import {
  CATEGORIAS,
  CORES_CAT,
  CORES_METODO,
  contarPorCategoria,
  contarPorMetodo,
  METODOS,
  RECEITAS,
  TOTAL_RECEITAS,
} from "@/lib/data";
import { validarModelos, validarReceitas } from "@/lib/schemas";
import type { Receita } from "@/lib/types";

describe("data/recipes.json", () => {
  it("tem um número coerente de receitas com ids únicos, inteiros positivos e sequenciais a partir de 1", () => {
    expect(TOTAL_RECEITAS).toBe(RECEITAS.length);
    expect(TOTAL_RECEITAS).toBeGreaterThan(0);
    const ids = RECEITAS.map((r) => r.id);
    expect(new Set(ids).size).toBe(ids.length);
    ids.forEach((id, i) => {
      expect(Number.isInteger(id)).toBe(true);
      expect(id).toBe(i + 1);
    });
  });

  it("agregações por método e categoria são coerentes com o total (sem valores hardcoded)", () => {
    const porMetodo = contarPorMetodo();
    expect(Object.values(porMetodo).reduce((a, b) => a + b, 0)).toBe(TOTAL_RECEITAS);
    for (const m of METODOS) expect(porMetodo[m]).toBeGreaterThan(0);
    const porCategoria = contarPorCategoria();
    expect(Object.values(porCategoria).reduce((a, b) => a + b, 0)).toBe(TOTAL_RECEITAS);
    for (const c of CATEGORIAS) expect(porCategoria[c]).toBeGreaterThan(0);
  });

  it("todas as receitas têm nome, ingredientes, passos, tempo e doses válidos", () => {
    for (const r of RECEITAS) {
      expect(r.nome.trim().length).toBeGreaterThan(0);
      expect(r.emoji.trim().length).toBeGreaterThan(0);
      expect(r.temp.trim().length).toBeGreaterThan(0);
      expect(r.ingredientes.length).toBeGreaterThan(0);
      expect(r.passos.length).toBeGreaterThan(0);
      expect(r.tempo).toBeGreaterThan(0);
      expect(r.doses).toBeGreaterThan(0);
    }
  });

  it("METODOS, CATEGORIAS e mapas de cores cobrem todos os valores do dataset", () => {
    for (const r of RECEITAS) {
      expect(METODOS).toContain(r.metodo);
      expect(CATEGORIAS).toContain(r.cat);
      expect(CORES_METODO[r.metodo]).toBeTruthy();
      expect(CORES_CAT[r.cat]).toBeTruthy();
    }
  });
});

describe("validarReceitas / validarModelos (o dataset pode crescer além de 200)", () => {
  const base: Omit<Receita, "id"> = {
    nome: "Teste",
    emoji: "🧪",
    metodo: "Air Fryer",
    cat: "Doces",
    tempo: 10,
    dificuldade: "Fácil",
    doses: 2,
    temp: "180°C",
    ingredientes: ["sal"],
    passos: ["Misturar"],
  };

  it("aceita mais de 200 receitas com ids únicos", () => {
    const muitas: Receita[] = Array.from({ length: 250 }, (_, i) => ({ ...base, id: i + 1 }));
    expect(validarReceitas(muitas)).toHaveLength(250);
  });

  it("rejeita ids duplicados, vazio, não inteiros ou negativos", () => {
    expect(() =>
      validarReceitas([
        { ...base, id: 1 },
        { ...base, id: 1 },
      ]),
    ).toThrow(/duplicado/);
    expect(() => validarReceitas([])).toThrow(/inválido/);
    expect(() => validarReceitas([{ ...base, id: 0 }])).toThrow(/inválido/);
    expect(() => validarReceitas([{ ...base, id: 1.5 }])).toThrow(/inválido/);
  });

  it("rejeita enums fora do contrato", () => {
    expect(() => validarReceitas([{ ...base, id: 1, metodo: "Micro-ondas" }])).toThrow(/inválido/);
    expect(() => validarReceitas([{ ...base, id: 1, dificuldade: "Difícil" }])).toThrow(/inválido/);
  });

  it("validarModelos aceita modelos novos e rejeita slugs duplicados", () => {
    const modelo = {
      id: "modelo-x",
      marca: "Marca",
      nome: "Modelo X",
      capacidadeL: 5,
      potenciaArQuenteW: 1500,
      potenciaVaporW: null,
      depositoAguaL: null,
      autonomiaVaporMin: null,
      receitasAppFabricante: null,
      ajuste: { tempoMin: 0, temperaturaC: 0 },
    };
    expect(validarModelos([modelo])).toHaveLength(1);
    expect(() => validarModelos([modelo, modelo])).toThrow(/duplicado/);
    expect(() => validarModelos([{ ...modelo, id: "ID INVÁLIDO" }])).toThrow(/inválido/);
  });
});

describe("fonte única das enumerações e navegação entre receitas", () => {
  it("os schemas zod usam exatamente as listas de lib/constants", async () => {
    const c = await import("@/lib/constants");
    const s = await import("@/lib/schemas");
    expect(s.metodoSchema.options).toEqual([...c.METODOS]);
    expect(s.categoriaSchema.options).toEqual([...c.CATEGORIAS]);
    expect(s.dificuldadeSchema.options).toEqual([...c.DIFICULDADES]);
  });

  it("vizinhasDaReceita devolve a anterior e a seguinte pela ordem do dataset", async () => {
    const { RECEITAS, vizinhasDaReceita } = await import("@/lib/data");
    const primeira = RECEITAS[0];
    const segunda = RECEITAS[1];
    const ultima = RECEITAS[RECEITAS.length - 1];
    if (!primeira || !segunda || !ultima) throw new Error("dataset demasiado pequeno");
    expect(vizinhasDaReceita(primeira.id)).toEqual({ anterior: undefined, seguinte: segunda });
    expect(vizinhasDaReceita(segunda.id).anterior).toBe(primeira);
    expect(vizinhasDaReceita(ultima.id).seguinte).toBeUndefined();
    expect(vizinhasDaReceita(-1)).toEqual({});
  });
});
