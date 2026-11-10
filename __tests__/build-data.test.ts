import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { afterEach, describe, expect, it } from "vitest";
import { RECEITAS, TOTAL_RECEITAS } from "@/lib/data";
import {
  carregarFicheiroReceitas,
  gerarFicheirosPorReceita,
  gerarFicheiroUnido,
  lerDiretorioReceitas,
  montarJson,
  verificarSincronia,
} from "@/scripts/build-data.ts";

const dirsTemp: string[] = [];

function dirTemp(): URL {
  const d = mkdtempSync(join(tmpdir(), "receitas-"));
  dirsTemp.push(d);
  return pathToFileURL(`${d}/`);
}

afterEach(() => {
  while (dirsTemp.length > 0) {
    const d = dirsTemp.pop();
    if (d) rmSync(d, { recursive: true, force: true });
  }
});

describe("data/recipes/ (um ficheiro por receita)", () => {
  it("tem um ficheiro por receita, com nome <id>.json e ids sequenciais a partir de 1", () => {
    const doDir = lerDiretorioReceitas();
    expect(doDir).toHaveLength(TOTAL_RECEITAS);
    for (const [i, r] of doDir.entries()) expect(r.id).toBe(i + 1);
  });

  it("o dataset gerado a partir de data/recipes/ é deep-equal ao data/recipes.json commitado", () => {
    // prova de que a divisão em ficheiros não alterou nenhuma receita (critério de aceitação M12)
    expect(lerDiretorioReceitas()).toEqual(carregarFicheiroReceitas());
    expect(lerDiretorioReceitas()).toEqual([...RECEITAS]);
    expect(montarJson(lerDiretorioReceitas())).toBe(montarJson(carregarFicheiroReceitas()));
  });

  it("verificarSincronia não falha com o dataset atual", () => {
    expect(() => verificarSincronia()).not.toThrow();
  });

  it("round-trip: split para diretório temporário e build de volta devolve o mesmo dataset", () => {
    const dir = dirTemp();
    const ficheiro = new URL("recipes.json", dirTemp());
    const n = gerarFicheirosPorReceita(new URL("../data/recipes.json", import.meta.url), dir);
    expect(n).toBe(TOTAL_RECEITAS);
    expect(lerDiretorioReceitas(dir)).toEqual([...RECEITAS]);
    const mudou = gerarFicheiroUnido(dir, ficheiro);
    expect(mudou).toBe(true);
    expect(carregarFicheiroReceitas(ficheiro)).toEqual([...RECEITAS]);
    expect(() => verificarSincronia(dir, ficheiro)).not.toThrow();
  });

  it("rejeita ficheiro cujo nome não é <id>.json", () => {
    const dir = dirTemp();
    writeFileSync(new URL("5.json", dir), JSON.stringify({ ...RECEITAS[0], id: 7 }));
    expect(() => lerDiretorioReceitas(dir)).toThrow(/<id>\.json/);
  });

  it("rejeita ids não sequenciais (com buracos)", () => {
    const dir = dirTemp();
    writeFileSync(new URL("1.json", dir), JSON.stringify(RECEITAS[0]));
    writeFileSync(new URL("3.json", dir), JSON.stringify({ ...RECEITAS[1], id: 3 }));
    expect(() => lerDiretorioReceitas(dir)).toThrow(/sequenciais/);
  });

  it("verificarSincronia falha quando o ficheiro combinado diverge do diretório", () => {
    const dir = dirTemp();
    gerarFicheirosPorReceita(new URL("../data/recipes.json", import.meta.url), dir);
    const ficheiro = new URL("recipes.json", dirTemp());
    gerarFicheiroUnido(dir, ficheiro);
    writeFileSync(
      ficheiro,
      montarJson([{ ...RECEITAS[0], nome: "Alterada" }, ...RECEITAS.slice(1)]),
    );
    expect(() => verificarSincronia(dir, ficheiro)).toThrow(/sincronia/);
  });
});
