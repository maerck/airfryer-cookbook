import { describe, expect, it } from "vitest";
import { RECEITAS } from "@/lib/data";
import {
  ajustarTemperatura,
  ajusteDescricao,
  aplicarAjusteModelo,
  encontrarModelo,
  formatarNumero,
  MODELO_PADRAO,
  MODELOS,
  temAjuste,
} from "@/lib/models";
import type { ModeloAirfryer } from "@/lib/types";

function modeloFake(patch: Partial<ModeloAirfryer> = {}): ModeloAirfryer {
  return {
    id: "modelo-teste",
    marca: "Marca",
    nome: "Modelo de Teste 5 L",
    capacidadeL: 5,
    potenciaArQuenteW: 1500,
    potenciaVaporW: null,
    depositoAguaL: null,
    autonomiaVaporMin: null,
    receitasAppFabricante: null,
    ajuste: { tempoMin: 0, temperaturaC: 0 },
    ...patch,
  };
}

describe("data/modelos.json", () => {
  it("contém exatamente 1 modelo: a Xiaomi Mijia Smart Steam Air Fryer 7 L", () => {
    expect(MODELOS).toHaveLength(1);
    const [m] = MODELOS;
    expect(m.id).toBe("xiaomi-mijia-steam-airfryer-7l");
    expect(m.marca).toBe("Xiaomi");
    expect(m.nome).toBe("Mijia Smart Steam Air Fryer 7 L");
    expect(m.capacidadeL).toBe(7);
    expect(m.potenciaArQuenteW).toBe(1800);
    expect(m.potenciaVaporW).toBe(900);
    expect(m.depositoAguaL).toBe(1.5);
    expect(m.autonomiaVaporMin).toBe(90);
    expect(m.receitasAppFabricante).toBe(100);
  });

  it("MODELO_PADRAO é o primeiro modelo e tem ajuste neutro", () => {
    expect(MODELO_PADRAO).toBe(MODELOS[0]);
    expect(MODELO_PADRAO.ajuste).toEqual({ tempoMin: 0, temperaturaC: 0 });
    expect(temAjuste(MODELO_PADRAO)).toBe(false);
  });

  it("ids são únicos", () => {
    expect(new Set(MODELOS.map((m) => m.id)).size).toBe(MODELOS.length);
  });
});

describe("encontrarModelo", () => {
  it("devolve o modelo quando o id existe", () => {
    expect(encontrarModelo("xiaomi-mijia-steam-airfryer-7l")).toBe(MODELO_PADRAO);
  });

  it("cai no modelo padrão para id desconhecido, null ou undefined", () => {
    expect(encontrarModelo("nao-existe")).toBe(MODELO_PADRAO);
    expect(encontrarModelo(null)).toBe(MODELO_PADRAO);
    expect(encontrarModelo(undefined)).toBe(MODELO_PADRAO);
  });
});

describe("ajustarTemperatura", () => {
  it("delta 0 devolve a string original", () => {
    expect(ajustarTemperatura("180°C", 0)).toBe("180°C");
    expect(ajustarTemperatura("Modo vapor", 0)).toBe("Modo vapor");
  });

  it("desloca temperaturas numéricas preservando o formato", () => {
    expect(ajustarTemperatura("180°C", 10)).toBe("190°C");
    expect(ajustarTemperatura("200°C", -15)).toBe("185°C");
  });

  it("desloca a temperatura dentro de strings compostas", () => {
    expect(ajustarTemperatura("Vapor → 190°C", 10)).toBe("Vapor → 200°C");
    expect(ajustarTemperatura("Vapor → 200°C", -10)).toBe("Vapor → 190°C");
  });

  it("não altera strings sem temperatura numérica", () => {
    expect(ajustarTemperatura("Modo vapor", 20)).toBe("Modo vapor");
  });

  it("nunca baixa de 0 °C", () => {
    expect(ajustarTemperatura("150°C", -200)).toBe("0°C");
  });
});

describe("aplicarAjusteModelo", () => {
  const receita = RECEITAS[0];

  it("com o modelo padrão (ajuste neutro) é identidade para todas as receitas", () => {
    for (const r of RECEITAS) {
      const a = aplicarAjusteModelo(r, MODELO_PADRAO);
      expect(a.tempo).toBe(r.tempo);
      expect(a.temp).toBe(r.temp);
    }
  });

  it("aplica deltas de tempo e temperatura do modelo", () => {
    const modelo = modeloFake({ ajuste: { tempoMin: -5, temperaturaC: 10 } });
    const a = aplicarAjusteModelo(receita, modelo);
    expect(a.tempo).toBe(receita.tempo - 5);
    expect(a.temp).toBe(ajustarTemperatura(receita.temp, 10));
  });

  it("limita o tempo a no mínimo 1 min", () => {
    const curta = { ...receita, tempo: 3 };
    const modelo = modeloFake({ ajuste: { tempoMin: -10, temperaturaC: 0 } });
    expect(aplicarAjusteModelo(curta, modelo).tempo).toBe(1);
  });

  it('deixa "Modo vapor" inalterado mesmo com delta de temperatura', () => {
    const vapor = RECEITAS.find((r) => r.temp === "Modo vapor");
    if (!vapor) throw new Error("nenhuma receita só a vapor");
    const modelo = modeloFake({ ajuste: { tempoMin: 0, temperaturaC: 20 } });
    expect(aplicarAjusteModelo(vapor, modelo).temp).toBe("Modo vapor");
  });
});

describe("ajusteDescricao", () => {
  it("ajuste neutro → Sem ajuste", () => {
    expect(ajusteDescricao({ tempoMin: 0, temperaturaC: 0 })).toBe("Sem ajuste");
  });

  it("descreve deltas com sinal", () => {
    expect(ajusteDescricao({ tempoMin: -5, temperaturaC: 10 })).toBe("-5 min, +10 °C");
    expect(ajusteDescricao({ tempoMin: 3, temperaturaC: 0 })).toBe("+3 min");
  });
});

describe("formatarNumero", () => {
  it("usa vírgula decimal pt-PT", () => {
    expect(formatarNumero(1.5)).toBe("1,5");
    expect(formatarNumero(1800)).toBe("1800");
  });
});

describe("temAjuste", () => {
  it("falso só quando ambos os deltas são zero", () => {
    expect(temAjuste(modeloFake())).toBe(false);
    expect(temAjuste(modeloFake({ ajuste: { tempoMin: 0, temperaturaC: -5 } }))).toBe(true);
    expect(temAjuste(modeloFake({ ajuste: { tempoMin: 2, temperaturaC: 0 } }))).toBe(true);
  });
});
