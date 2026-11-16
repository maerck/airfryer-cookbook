import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ReceitaDetalhe from "@/components/ReceitaDetalhe";
import {
  atribuicaoDaReceita,
  METODO_CHIP,
  paramsReceitas,
  receitaPorId,
  TOTAL_RECEITAS,
  vizinhasDaReceita,
} from "@/lib/data";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams(): { id: string }[] {
  return paramsReceitas();
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const receita = receitaPorId(Number(id));
  if (!receita) return { title: "Receita não encontrada · 200 Receitas" };
  const atribuicao = atribuicaoDaReceita(receita);
  return {
    title: `${receita.nome} · 200 Receitas · Air Fryer & Vapor`,
    description: `${receita.emoji} ${receita.nome} — ${METODO_CHIP[receita.metodo]}, ${receita.cat}, ${receita.tempo} min, ${receita.dificuldade}. Receita para air fryer e vapor.${atribuicao ? ` ${atribuicao}.` : ""}`,
    alternates: {
      canonical: `/receita/${id}`,
    },
  };
}

export default async function ReceitaPage({ params }: PageProps) {
  const { id } = await params;
  const receita = receitaPorId(Number(id));
  if (!receita) notFound();
  const { anterior, seguinte } = vizinhasDaReceita(receita.id);
  return (
    <ReceitaDetalhe
      receita={receita}
      anterior={anterior && { id: anterior.id, nome: anterior.nome }}
      seguinte={seguinte && { id: seguinte.id, nome: seguinte.nome }}
      totalReceitas={TOTAL_RECEITAS}
    />
  );
}
