import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Nomes vistos nos relatórios PDF importados que ainda não têm cadastro de membro.
// Alimenta o autocomplete do "Nome completo" no cadastro, evitando redigitar nomes
// que o app já conhece pela leitura do Semáforos.
export async function GET() {
  const [records, members] = await Promise.all([
    prisma.performanceRecord.findMany({
      select: { memberName: true },
      distinct: ["memberName"],
    }),
    prisma.member.findMany({ select: { name: true } }),
  ]);

  const existing = new Set(members.map((m) => m.name.trim().toLowerCase()));
  const candidates = Array.from(
    new Set(
      records
        .map((r) => r.memberName.trim())
        .filter((n) => n && !existing.has(n.toLowerCase()))
    )
  ).sort((a, b) => a.localeCompare(b, "pt-BR"));

  return NextResponse.json(candidates);
}
