import { describe, expect, it } from "vitest";
import { RECEITAS } from "@/lib/data";
import { escalarIngrediente, escalarIngredientes } from "@/lib/doses";

describe("escalarIngrediente", () => {
  it("escala o número inicial pelo fator", () => {
    expect(escalarIngrediente("200 g de esparguete", 2)).toBe("400 g de esparguete");
    expect(escalarIngrediente("2 dentes de alho picados", 3)).toBe("6 dentes de alho picados");
    expect(escalarIngrediente("1 kg de asas de frango", 0.5)).toBe("0,5 kg de asas de frango");
  });

  it("trata vírgula decimal pt-PT", () => {
    expect(escalarIngrediente("1,5 L de água", 2)).toBe("3 L de água");
    expect(escalarIngrediente("0,5 c. chá de sal", 4)).toBe("2 c. chá de sal");
  });

  it("escala intervalos no início (2–3 ovos → 4–6 ovos)", () => {
    expect(escalarIngrediente("2–3 ovos", 2)).toBe("4–6 ovos");
  });

  it("escala frações (1/2 → 1)", () => {
    expect(escalarIngrediente("1/2 chávena de leite", 2)).toBe("1 chávena de leite");
  });

  it("não altera texto sem número inicial nem números no meio do texto", () => {
    expect(escalarIngrediente("sal q.b.", 4)).toBe("sal q.b.");
    expect(escalarIngrediente("Sal e pimenta preta", 2)).toBe("Sal e pimenta preta");
    expect(escalarIngrediente("1 frango pequeno (~1,2 kg — cabe no cesto de 7 L)", 2)).toBe(
      "2 frango pequeno (~1,2 kg — cabe no cesto de 7 L)",
    );
  });

  it("fator 1 é identidade", () => {
    expect(escalarIngrediente("300 g de arroz", 1)).toBe("300 g de arroz");
    expect(escalarIngredientes(["300 g de arroz", "sal q.b."], 1)).toEqual([
      "300 g de arroz",
      "sal q.b.",
    ]);
  });

  it("no dataset real: fator 1 preserva tudo e fator 2 só mexe no início", () => {
    const todos = RECEITAS.flatMap((r) => r.ingredientes);
    expect(escalarIngredientes(todos, 1)).toEqual([...todos]);
    for (const original of todos) {
      const escalado = escalarIngrediente(original, 2);
      if (/^\s*\d/.test(original)) {
        expect(escalado).not.toBe(original);
      } else {
        expect(escalado).toBe(original);
      }
    }
  });
});
