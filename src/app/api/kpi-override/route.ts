import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession } from "@/lib/auth";

const KPI_IDS = ["convidados", "refDadas", "uegs", "reunioes1a1", "testemunhos", "opnf"];

// Ajuste rápido de KPI feito no dashboard (lançamento em tempo real)
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session?.memberId) return NextResponse.json({ error: "Sem membro vinculado" }, { status: 403 });

  const { kpiId, value } = await req.json();
  if (!KPI_IDS.includes(kpiId)) return NextResponse.json({ error: "KPI inválido" }, { status: 400 });
  const v = Math.max(parseFloat(value) || 0, 0);

  const override = await prisma.kpiOverride.upsert({
    where: { memberId_kpiId: { memberId: session.memberId, kpiId } },
    create: { memberId: session.memberId, kpiId, value: v },
    update: { value: v },
  });

  return NextResponse.json(override);
}
