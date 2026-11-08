import { ImageResponse } from "next/og";

export const alt = "200 Receitas · Air Fryer & Vapor";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        padding: 80,
        background: "linear-gradient(135deg, #1c1917 0%, #292524 55%, #451a03 100%)",
        color: "white",
      }}
    >
      <div style={{ fontSize: 64, fontWeight: 700, letterSpacing: -2 }}>
        200 Receitas · Air Fryer &amp; Vapor
      </div>
      <div style={{ marginTop: 24, fontSize: 28, color: "#d6d3d1" }}>
        Concebidas para a Xiaomi Mijia Smart Steam Air Fryer 7 L — ar quente, vapor e modo
        combinado.
      </div>
      <div style={{ marginTop: 40, fontSize: 22, color: "#a8a29e" }}>
        Filtra por método ou categoria · guarda favoritas · lista de compras
      </div>
    </div>,
    { ...size },
  );
}
