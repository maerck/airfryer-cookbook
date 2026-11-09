import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "200 Receitas · Air Fryer & Vapor",
    short_name: "200 Receitas",
    description:
      "200 receitas em português europeu para a Xiaomi Mijia Smart Steam Air Fryer 7 L — ar quente, vapor e modo combinado.",
    lang: "pt",
    start_url: "/",
    scope: "/",
    display: "standalone",
    background_color: "#1c1917",
    theme_color: "#1c1917",
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
    ],
  };
}
