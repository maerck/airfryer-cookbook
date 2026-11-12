// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import { RECEITAS } from "@/lib/data";
import { guardarIngredientesMarcados, lerFavoritas, lerIngredientesMarcados } from "@/lib/storage";

/** localStorage é entrada não confiável: qualquer script same-origin escreve lá. */

describe("storage — validação de ingredientes marcados contra o dataset", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("aceita índices válidos de uma receita existente", () => {
    const r = RECEITAS[0];
    if (!r) throw new Error("dataset vazio");
    guardarIngredientesMarcados({ [r.id]: [0, 1] });
    expect(lerIngredientesMarcados()[r.id]).toEqual([0, 1]);
  });

  it("descarta índices fora do intervalo da receita (CWE-129)", () => {
    const r = RECEITAS[0];
    if (!r) throw new Error("dataset vazio");
    const limite = r.ingredientes.length;
    localStorage.setItem(
      "af200:ingredientes",
      JSON.stringify({ [r.id]: [0, limite, 9999, -1, -9999] }),
    );
    const resultado = lerIngredientesMarcados();
    expect(resultado[r.id]).toEqual([0]);
  });

  it("descarta ids de receita inexistentes", () => {
    localStorage.setItem("af200:ingredientes", JSON.stringify({ 99999: [0, 1] }));
    expect(lerIngredientesMarcados()).toEqual({});
  });

  it("descarta duplicados e mantém a ordem", () => {
    const r = RECEITAS[0];
    if (!r) throw new Error("dataset vazio");
    const limite = r.ingredientes.length;
    if (limite < 2) throw new Error("receita de teste com menos de 2 ingredientes");
    localStorage.setItem("af200:ingredientes", JSON.stringify({ [r.id]: [1, 1, 0, 0, 1] }));
    expect(lerIngredientesMarcados()[r.id]).toEqual([0, 1]);
  });

  it("JSON inválido degrada para vazio", () => {
    localStorage.setItem("af200:ingredientes", "{não é json");
    expect(lerIngredientesMarcados()).toEqual({});
  });

  it("favoritas continua a aceitar apenas inteiros", () => {
    localStorage.setItem("af200:favoritas", JSON.stringify([1, "2", 3.5, null, -7]));
    expect([...lerFavoritas()]).toEqual([1, -7]);
  });
});
