import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Em JSX, o texto entre tags e os atributos entre aspas não processam sequências de escape:
 * um escape unicode escrito por extenso aparece tal e qual no ecrã. Os caracteres pt-PT e os
 * emojis escrevem-se diretamente no código-fonte (UTF-8).
 */
const BARRA = String.fromCharCode(92);
const ESCAPE_UNICODE = new RegExp(`${BARRA}${BARRA}u(?:[0-9a-fA-F]{4}|${BARRA}{)`);

function ficheirosTsx(pasta: string): string[] {
  return readdirSync(pasta, { withFileTypes: true }).flatMap((entrada) => {
    const caminho = join(pasta, entrada.name);
    if (entrada.isDirectory()) return ficheirosTsx(caminho);
    return entrada.name.endsWith(".tsx") ? [caminho] : [];
  });
}

describe("copy da UI", () => {
  it("nenhum componente tem sequências de escape unicode por extenso", () => {
    const comEscapes = [...ficheirosTsx("app"), ...ficheirosTsx("components")].flatMap((ficheiro) =>
      readFileSync(ficheiro, "utf8")
        .split("\n")
        .flatMap((linha, i) => (ESCAPE_UNICODE.test(linha) ? [`${ficheiro}:${i + 1}`] : [])),
    );
    expect(comEscapes).toEqual([]);
  });
});
