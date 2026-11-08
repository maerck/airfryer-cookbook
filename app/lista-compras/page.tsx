import type { Metadata } from "next";
import ListaComprasClient from "@/components/ListaComprasClient";

export const metadata: Metadata = {
  title: "Lista de compras · 200 Receitas · Air Fryer & Vapor",
  description:
    "A tua lista de compras agrega os ingredientes que marcaste nas receitas — pronta para ir às compras.",
};

export default function ListaComprasPage() {
  return <ListaComprasClient />;
}
