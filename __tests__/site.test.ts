import { describe, expect, it } from "vitest";
import { resolverSiteUrl } from "@/lib/site";

describe("resolverSiteUrl", () => {
  it("usa NEXT_PUBLIC_SITE_URL quando definido (sem barra final)", () => {
    expect(resolverSiteUrl({ NEXT_PUBLIC_SITE_URL: "https://receitas.example/" })).toBe(
      "https://receitas.example",
    );
  });

  it("prefere o URL explícito ao domínio da Vercel", () => {
    expect(
      resolverSiteUrl({
        NEXT_PUBLIC_SITE_URL: "https://receitas.example",
        VERCEL_PROJECT_PRODUCTION_URL: "airfryer.vercel.app",
      }),
    ).toBe("https://receitas.example");
  });

  it("na Vercel, sem URL explícito, usa o domínio de produção do projeto", () => {
    expect(resolverSiteUrl({ VERCEL_PROJECT_PRODUCTION_URL: "airfryer.vercel.app" })).toBe(
      "https://airfryer.vercel.app",
    );
  });

  it("sem nada configurado (ou só espaços) cai em localhost", () => {
    expect(resolverSiteUrl({})).toBe("http://localhost:3000");
    expect(resolverSiteUrl({ NEXT_PUBLIC_SITE_URL: "  " })).toBe("http://localhost:3000");
  });
});
