import { describe, expect, it } from "vitest";
import { contarPorCategoria, contarPorMetodo, RECEITAS, TOTAL_RECEITAS } from "@/lib/data";
import {
  correspondePesquisa,
  ESTADO_INICIAL,
  type EstadoFiltro,
  estadoParaParams,
  filtrarReceitas,
  lerEstadoDeParams,
  normalizar,
} from "@/lib/filters";
import type { Receita } from "@/lib/types";

function estado(patch: Partial<EstadoFiltro> = {}): EstadoFiltro {
  return { ...ESTADO_INICIAL, favoritas: new Set<number>(), ...patch };
}

describe("normalizar", () => {
  it("ignora maiúsculas e acentos", () => {
    expect(normalizar("Frango Assado")).toBe("frango assado");
    expect(normalizar("PÃO de Ló")).toBe("pao de lo");
  });
});

describe("correspondePesquisa", () => {
  const frango = RECEITAS.find((r) => r.id === 1);
  if (!frango) throw new Error("receita 1 em falta");

  it("pesquisa vazia corresponde a tudo", () => {
    expect(correspondePesquisa(frango, "   ")).toBe(true);
  });

  it("corresponde por nome sem_ACENTOS e minúsculas", () => {
    expect(correspondePesquisa(frango, "FRANGO")).toBe(true);
    expect(correspondePesquisa(frango, "limao")).toBe(true);
  });

  it("corresponde por ingrediente", () => {
    const salmon = RECEITAS.find((r) =>
      r.ingredientes.some((i) => normalizar(i).includes("salmao")),
    );
    if (!salmon) throw new Error("nenhuma receita com salmão");
    expect(correspondePesquisa(salmon, "SALMAO")).toBe(true);
  });

  it("corresponde por categoria e método", () => {
    expect(correspondePesquisa(frango, "carne")).toBe(true);
    expect(correspondePesquisa(frango, "air fryer")).toBe(true);
  });

  it("não corresponde a texto inexistente", () => {
    expect(correspondePesquisa(frango, "xyzzy não existe")).toBe(false);
  });
});

describe("filtrarReceitas", () => {
  it("sem filtros devolve todas as receitas do dataset", () => {
    expect(filtrarReceitas(RECEITAS, estado())).toHaveLength(TOTAL_RECEITAS);
  });

  it("filtros por método/categoria devolvem os agregados atuais do dataset", () => {
    const porMetodo = contarPorMetodo();
    const porCategoria = contarPorCategoria();
    expect(filtrarReceitas(RECEITAS, estado({ metodo: "Vapor" }))).toHaveLength(porMetodo.Vapor);
    expect(filtrarReceitas(RECEITAS, estado({ metodo: "Vapor + Ar" }))).toHaveLength(
      porMetodo["Vapor + Ar"],
    );
    expect(filtrarReceitas(RECEITAS, estado({ metodo: "Air Fryer" }))).toHaveLength(
      porMetodo["Air Fryer"],
    );
    expect(filtrarReceitas(RECEITAS, estado({ cat: "Carne" }))).toHaveLength(porCategoria.Carne);
  });

  it("só favoritas restringe ao conjunto de favoritas", () => {
    const favoritas = new Set([1, 2, 3]);
    const resultado = filtrarReceitas(RECEITAS, estado({ soFavoritas: true, favoritas }));
    expect(resultado.map((r) => r.id)).toEqual([1, 2, 3]);
  });

  it("filtro por dificuldade e por tempo máximo", () => {
    const soFaceis = filtrarReceitas(RECEITAS, estado({ dif: "Muito fácil" }));
    expect(soFaceis.length).toBeGreaterThan(0);
    for (const r of soFaceis) expect(r.dificuldade).toBe("Muito fácil");
    const rapidas = filtrarReceitas(RECEITAS, estado({ tempoMax: 30 }));
    expect(rapidas.length).toBeGreaterThan(0);
    for (const r of rapidas) expect(r.tempo).toBeLessThanOrEqual(30);
  });

  it("ordem=tempo ordena por tempo ascendente (desempate por id)", () => {
    const resultado = filtrarReceitas(RECEITAS, estado({ ordem: "tempo" }));
    for (let i = 1; i < resultado.length; i++) {
      const prev = resultado[i - 1];
      const atual = resultado[i];
      expect(atual.tempo > prev.tempo || (atual.tempo === prev.tempo && atual.id > prev.id)).toBe(
        true,
      );
    }
  });

  it("ordem=tempo-desc ordena por tempo descendente", () => {
    const resultado = filtrarReceitas(RECEITAS, estado({ ordem: "tempo-desc" }));
    for (let i = 1; i < resultado.length; i++) {
      const prev = resultado[i - 1];
      const atual = resultado[i];
      expect(prev.tempo > atual.tempo || (prev.tempo === atual.tempo && prev.id < atual.id)).toBe(
        true,
      );
    }
  });

  it("ordem=nome ordena alfabeticamente em pt-PT", () => {
    const resultado = filtrarReceitas(RECEITAS, estado({ ordem: "nome" }));
    for (let i = 1; i < resultado.length; i++) {
      const prev = resultado[i - 1];
      const atual = resultado[i];
      expect(
        prev.nome.localeCompare(atual.nome, "pt-PT") < 0 ||
          (prev.nome.localeCompare(atual.nome, "pt-PT") === 0 && prev.id < atual.id),
      ).toBe(true);
    }
  });

  it("ordem=dificuldade ordena por severidade (Muito fácil → Média)", () => {
    const ordem = { "Muito fácil": 0, Fácil: 1, Média: 2 } as const;
    const resultado = filtrarReceitas(RECEITAS, estado({ ordem: "dificuldade" }));
    for (let i = 1; i < resultado.length; i++) {
      const prev = resultado[i - 1];
      const atual = resultado[i];
      expect(
        ordem[prev.dificuldade] < ordem[atual.dificuldade] ||
          (ordem[prev.dificuldade] === ordem[atual.dificuldade] && prev.tempo <= atual.tempo),
      ).toBe(true);
    }
  });

  it("pesquisa + método + categoria intersectam", () => {
    const soVapor = filtrarReceitas(RECEITAS, estado({ metodo: "Vapor" }));
    const resultado = filtrarReceitas(
      RECEITAS,
      estado({ metodo: "Vapor", cat: "Doces", q: "canela" }),
    );
    for (const r of resultado) {
      expect(r.metodo).toBe("Vapor");
      expect(r.cat).toBe("Doces");
      expect(correspondePesquisa(r, "canela")).toBe(true);
    }
    expect(resultado.length).toBeLessThanOrEqual(soVapor.length);
    expect(resultado.length).toBeGreaterThan(0);
  });

  it("filtros combinados podem devolver vazio", () => {
    const resultado = filtrarReceitas(RECEITAS, estado({ metodo: "Vapor", q: "xyzzy não existe" }));
    expect(resultado).toHaveLength(0);
  });
});

describe("estado <-> search params", () => {
  it("round-trip preserva o estado", () => {
    const original = estado({
      q: "frango",
      metodo: "Vapor + Ar",
      cat: "Doces",
      dif: "Fácil",
      tempoMax: 30,
      soFavoritas: true,
      ordem: "nome",
    });
    const params = new URLSearchParams(estadoParaParams(original));
    expect(lerEstadoDeParams(params)).toEqual({
      q: "frango",
      metodo: "Vapor + Ar",
      cat: "Doces",
      dif: "Fácil",
      tempoMax: 30,
      soFavoritas: true,
      ordem: "nome",
    });
  });

  it("o estado inicial não gera parâmetros", () => {
    expect(estadoParaParams(ESTADO_INICIAL)).toEqual({});
    expect(lerEstadoDeParams(new URLSearchParams())).toEqual(ESTADO_INICIAL);
  });

  it("valores inválidos nos parâmetros caem no estado inicial", () => {
    const params = new URLSearchParams(
      "metodo=Hifen&cat=Gelados&dif=Difícil&tmax=abc&fav=sim&ord=talvez",
    );
    expect(lerEstadoDeParams(params)).toEqual(ESTADO_INICIAL);
  });

  it("ord=1 (legado) mapeia para ordem=tempo", () => {
    expect(lerEstadoDeParams(new URLSearchParams("ord=1")).ordem).toBe("tempo");
    expect(estadoParaParams({ ...ESTADO_INICIAL, ordem: "tempo" }).ord).toBe("tempo");
  });
});

describe("fixture sintética", () => {
  const base: Receita = {
    id: 999,
    nome: "Teste",
    emoji: "🧪",
    metodo: "Air Fryer",
    cat: "Doces",
    tempo: 10,
    dificuldade: "Fácil",
    doses: 2,
    temp: "180°C",
    ingredientes: ["açúcar"],
    passos: ["Misturar"],
  };

  it("filtra a fixture pelos campos do contrato", () => {
    const lista: Receita[] = [base];
    expect(filtrarReceitas(lista, estado({ q: "açucar" }))).toHaveLength(1);
    expect(filtrarReceitas(lista, estado({ q: "acucar" }))).toHaveLength(1);
    expect(filtrarReceitas(lista, estado({ metodo: "Vapor" }))).toHaveLength(0);
    expect(filtrarReceitas(lista, estado({ cat: "Doces" }))).toHaveLength(1);
    expect(filtrarReceitas(lista, estado({ dif: "Fácil" }))).toHaveLength(1);
    expect(filtrarReceitas(lista, estado({ dif: "Média" }))).toHaveLength(0);
    expect(filtrarReceitas(lista, estado({ tempoMax: 10 }))).toHaveLength(1);
    expect(filtrarReceitas(lista, estado({ tempoMax: 9 }))).toHaveLength(0);
    expect(
      filtrarReceitas(lista, estado({ soFavoritas: true, favoritas: new Set([999]) })),
    ).toHaveLength(1);
    expect(
      filtrarReceitas(lista, estado({ soFavoritas: true, favoritas: new Set([1]) })),
    ).toHaveLength(0);
  });
});
