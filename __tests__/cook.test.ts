import { describe, expect, it } from "vitest";
import { extrairMinutosDoPasso, formatarDuracao } from "@/lib/cook";
import { RECEITAS } from "@/lib/data";

describe("extrairMinutosDoPasso", () => {
  it("extrai minutos simples", () => {
    expect(extrairMinutosDoPasso("Coze a 200°C durante 12 min.")).toBe(12);
    expect(extrairMinutosDoPasso("Deixa descansar 5 min antes de cortar.")).toBe(5);
  });

  it("usa o limite superior em intervalos (10–12 min → 12)", () => {
    expect(extrairMinutosDoPasso("Coze a 180°C durante 40–45 min, virando a meio.")).toBe(45);
    expect(extrairMinutosDoPasso("Vira e coze mais 10–12 min.")).toBe(12);
    expect(extrairMinutosDoPasso("por 2–3 min para caramelizar")).toBe(3);
  });

  it("converte horas em minutos", () => {
    expect(extrairMinutosDoPasso("deixa levedar 1 hora")).toBe(60);
    expect(extrairMinutosDoPasso("marina no mínimo 2 horas")).toBe(120);
  });

  it("devolve null sem duração (e não confunde °C com minutos)", () => {
    expect(extrairMinutosDoPasso("Coze a 200°C até dourar.")).toBeNull();
    expect(extrairMinutosDoPasso("Tempera com sal e pimenta.")).toBeNull();
  });

  it("no dataset real encontra temporizadores numa fração substantial dos passos", () => {
    const passos = RECEITAS.flatMap((r) => r.passos);
    const comTempo = passos.filter((p) => extrairMinutosDoPasso(p) !== null);
    expect(comTempo.length).toBeGreaterThan(passos.length * 0.3);
    for (const p of comTempo) {
      expect(extrairMinutosDoPasso(p)).toBeGreaterThan(0);
    }
  });
});

describe("formatarDuracao", () => {
  it("formata mm:ss", () => {
    expect(formatarDuracao(0)).toBe("00:00");
    expect(formatarDuracao(65)).toBe("01:05");
    expect(formatarDuracao(599)).toBe("09:59");
  });

  it("formata h:mm:ss acima de uma hora e limita a zero", () => {
    expect(formatarDuracao(3600)).toBe("1:00:00");
    expect(formatarDuracao(3661)).toBe("1:01:01");
    expect(formatarDuracao(-5)).toBe("00:00");
  });
});
