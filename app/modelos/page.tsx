import type { Metadata } from "next";
import ModelosClient from "@/components/ModelosClient";
import { TOTAL_RECEITAS } from "@/lib/data";

export const metadata: Metadata = {
  title: "Modelos de airfryer · 200 Receitas · Air Fryer & Vapor",
  description:
    "Modelos de airfryer suportados. Escolhe o modelo ativo e as receitas são ajustadas a esse equipamento.",
};

export default function ModelosPage() {
  return <ModelosClient totalReceitas={TOTAL_RECEITAS} />;
}
